"""ia-mapper: interfaz única de ingesta de equipos de laboratorio.

Reemplaza la ventana CMD (InterfazLabsis) por un endpoint HTTP que acepta
archivos planos heterogéneos (ancho fijo tipo G6PD.A34, CSV, TXT, HL7 v2)
y los normaliza a FHIR R5 DiagnosticReport antes de publicarlos en Kafka
para consumo por ms-muestras y ms-analitico.

El mapeo combina:
  1) Parsers deterministas por firma de formato (rápidos, sin coste LLM).
  2) Fallback vía Anthropic Claude cuando el formato no es reconocido,
     con un prompt acotado y validación del JSON resultante.

Observabilidad: métricas Prometheus + trazas OTel. Cada request porta
un trace_id que se propaga al evento Kafka (header "trace_id").
"""
from __future__ import annotations

import asyncio
import json
import os
import re
import uuid
from datetime import datetime, timezone

import structlog
from aiokafka import AIOKafkaProducer
from fastapi import FastAPI, Request, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

from .parsers import parse_plain_fixed_width, parse_csv_labsis, parse_hl7_v2
from .llm_mapper import llm_map_to_fhir


# ----------------------------- setup -----------------------------

LOG = structlog.get_logger("ia-mapper")
KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP", "redpanda:29092")
TOPIC_NORMALIZED = os.getenv("TOPIC_NORMALIZED", "normalized.results")
TOPIC_RAW = os.getenv("TOPIC_RAW", "raw.ingest")
FALLBACK_ONLY = os.getenv("IA_FALLBACK_ONLY", "false").lower() == "true"
SERVICE_NAME = os.getenv("OTEL_SERVICE_NAME", "ia-mapper")

resource = Resource.create({"service.name": SERVICE_NAME})
provider = TracerProvider(resource=resource)
otlp = OTLPSpanExporter()
provider.add_span_processor(BatchSpanProcessor(otlp))
trace.set_tracer_provider(provider)
tracer = trace.get_tracer(SERVICE_NAME)

app = FastAPI(title="ia-mapper", version="0.1.0")
FastAPIInstrumentor.instrument_app(app)

# Métricas Prometheus (se unen con las enviadas por OTel; permiten scrape directo)
MET_INGEST = Counter(
    "labsis_ia_mapper_ingestas_total",
    "Tramas ingresadas al ia-mapper",
    ["formato", "resultado"],
)
MET_LAT = Histogram(
    "labsis_ia_mapper_latencia",
    "Latencia del ciclo completo ingesta->publish",
    ["formato"],
    buckets=(0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10),
)

_producer: AIOKafkaProducer | None = None


async def get_producer() -> AIOKafkaProducer:
    global _producer
    if _producer is None:
        _producer = AIOKafkaProducer(bootstrap_servers=KAFKA_BOOTSTRAP)
        await _producer.start()
    return _producer


# ----------------------------- helpers -----------------------------

def detect_format(body: bytes, filename: str | None) -> str:
    """Heurística ligera de detección de formato."""
    head = body[:512].decode("utf-8", errors="ignore")
    if head.startswith("MSH|") or "|^~\\&|" in head:
        return "hl7v2"
    if filename and filename.lower().endswith(".csv"):
        return "csv"
    if filename and filename.lower().endswith((".a34", ".txt")):
        return "plain_fwf"
    # default guess: si líneas tienen columnas separadas por múltiples espacios -> FWF
    lines = [L for L in head.splitlines() if L.strip()]
    if lines and re.search(r"\s{2,}", lines[0]):
        return "plain_fwf"
    return "unknown"


def build_diagnostic_report(
    resultados: list[dict],
    paciente_hint: dict | None,
    trace_id: str,
    equipo_id: str,
    formato: str,
) -> dict:
    return {
        "resourceType": "DiagnosticReport",
        "id": str(uuid.uuid4()),
        "status": "preliminary",
        "meta": {"source": f"ia-mapper/{equipo_id}"},
        "effectiveDateTime": datetime.now(timezone.utc).isoformat(),
        "identifier": [{"value": trace_id}],
        "subject": paciente_hint,
        "performer": [{"display": equipo_id}],
        "observation": resultados,
        "_source": {"format": formato, "equipo": equipo_id},
    }


# ----------------------------- routes -----------------------------

@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.get("/metrics")
async def metrics() -> JSONResponse:
    return JSONResponse(
        content=None,
        media_type=CONTENT_TYPE_LATEST,
    ).__class__(content=generate_latest().decode(), media_type=CONTENT_TYPE_LATEST)


@app.post("/ingest")
async def ingest(
    request: Request,
    file: UploadFile | None = File(default=None),
    equipo_id: str = Form(default="UNKNOWN"),
    cedula_madre: str | None = Form(default=None),
):
    """Endpoint principal: recibe una trama, la normaliza y la publica.

    Parámetros multipart:
      - file: archivo crudo (G6PD.A34, CSV, TXT o HL7 v2)
      - equipo_id: ID del equipo emisor (propagado a FHIR.performer)
      - cedula_madre: opcional, para correlacionar con paciente en ms-muestras
    """
    trace_id = request.headers.get("x-trace-id") or str(uuid.uuid4())
    with tracer.start_as_current_span("ingest") as span:
        span.set_attribute("equipo.id", equipo_id)
        span.set_attribute("trace.id", trace_id)

        if file is None:
            raise HTTPException(400, "file is required")
        body = await file.read()
        formato = detect_format(body, file.filename)
        span.set_attribute("trama.formato", formato)

        t0 = asyncio.get_event_loop().time()
        try:
            resultados = await normalize(body, formato, equipo_id, trace_id)
            MET_INGEST.labels(formato=formato, resultado="ok").inc()
        except Exception as e:
            LOG.exception("ingest.failed", equipo_id=equipo_id, error=str(e))
            MET_INGEST.labels(formato=formato, resultado="error").inc()
            raise HTTPException(500, f"normalization failed: {e}")
        finally:
            MET_LAT.labels(formato=formato).observe(asyncio.get_event_loop().time() - t0)

        paciente_hint = {"cedula_madre": cedula_madre} if cedula_madre else None
        report = build_diagnostic_report(resultados, paciente_hint, trace_id, equipo_id, formato)

        prod = await get_producer()
        payload = json.dumps(report).encode("utf-8")
        await prod.send_and_wait(
            TOPIC_NORMALIZED,
            payload,
            headers=[("trace_id", trace_id.encode())],
        )
        LOG.info("ingest.ok", equipo_id=equipo_id, trace_id=trace_id, n=len(resultados))
        return {
            "status": "accepted",
            "trace_id": trace_id,
            "count": len(resultados),
            "format": formato,
            "report_id": report["id"],
        }


async def normalize(body: bytes, formato: str, equipo_id: str, trace_id: str) -> list[dict]:
    """Devuelve la lista normalizada de observaciones (analito/valor/unidad)."""
    text = body.decode("utf-8", errors="replace")
    if formato == "plain_fwf" and not FALLBACK_ONLY:
        try:
            return parse_plain_fixed_width(text)
        except Exception as e:
            LOG.warning("fwf.parse_failed, falling back to LLM", error=str(e))
    if formato == "csv" and not FALLBACK_ONLY:
        try:
            return parse_csv_labsis(text)
        except Exception as e:
            LOG.warning("csv.parse_failed, falling back to LLM", error=str(e))
    if formato == "hl7v2" and not FALLBACK_ONLY:
        try:
            return parse_hl7_v2(text)
        except Exception as e:
            LOG.warning("hl7.parse_failed, falling back to LLM", error=str(e))

    # LLM fallback para formatos desconocidos o parsers que fallaron
    with tracer.start_as_current_span("llm.map") as sp:
        sp.set_attribute("equipo.id", equipo_id)
        return await llm_map_to_fhir(text, equipo_id, trace_id)
