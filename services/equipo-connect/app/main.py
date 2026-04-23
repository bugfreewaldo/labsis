"""equipo-connect: agente zero-trust que reemplaza la ventana CMD InterfazLabsis.

Observa un directorio local donde los equipos dejan tramas (G6PD.A34, CSV, HL7),
firma cada archivo con un hash SHA-256 y marca temporal, y lo envía al ia-mapper
vía HTTPS. En el despliegue real el canal usa mTLS con un certificado por equipo
emitido por cert-manager; en el MVP local se usa HTTP con el equipo_id y el hash
como prueba de origen para mantener el demo simple.
"""
from __future__ import annotations

import hashlib
import os
import signal
import sys
import time
import uuid
from pathlib import Path

import httpx
import structlog
from prometheus_client import Counter, start_http_server
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer


LOG = structlog.get_logger("equipo-connect")

WATCH_DIR = Path(os.getenv("WATCH_DIR", "/incoming"))
UPLOAD_URL = os.getenv("UPLOAD_URL", "http://ia-mapper:8000/ingest")
EQUIPO_ID = os.getenv("EQUIPO_ID", "EQ-LAB-001")
SERVICE_NAME = os.getenv("OTEL_SERVICE_NAME", "equipo-connect")

resource = Resource.create({"service.name": SERVICE_NAME, "equipo.id": EQUIPO_ID})
provider = TracerProvider(resource=resource)
provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter()))
trace.set_tracer_provider(provider)
tracer = trace.get_tracer(SERVICE_NAME)

MET_SENT = Counter(
    "labsis_equipo_connect_envios_total",
    "Archivos enviados por equipo-connect",
    ["equipo", "resultado"],
)


def sign(body: bytes) -> str:
    return hashlib.sha256(body).hexdigest()


def upload(path: Path) -> None:
    """Leer archivo, firmar y enviar al ia-mapper. Registra en OTel."""
    trace_id = str(uuid.uuid4())
    with tracer.start_as_current_span("upload") as span:
        span.set_attribute("equipo.id", EQUIPO_ID)
        span.set_attribute("file.path", str(path))
        span.set_attribute("trace.id", trace_id)

        try:
            body = path.read_bytes()
        except FileNotFoundError:
            LOG.warning("file.vanished", path=str(path))
            return
        digest = sign(body)
        files = {"file": (path.name, body, "application/octet-stream")}
        headers = {
            "x-trace-id": trace_id,
            "x-equipo-id": EQUIPO_ID,
            "x-file-sha256": digest,
        }
        data = {"equipo_id": EQUIPO_ID}
        try:
            with httpx.Client(timeout=30) as cli:
                r = cli.post(UPLOAD_URL, files=files, data=data, headers=headers)
            r.raise_for_status()
            MET_SENT.labels(equipo=EQUIPO_ID, resultado="ok").inc()
            LOG.info("upload.ok", file=path.name, status=r.status_code, trace_id=trace_id)
        except Exception as e:
            MET_SENT.labels(equipo=EQUIPO_ID, resultado="error").inc()
            LOG.error("upload.failed", file=path.name, error=str(e))


class IncomingHandler(FileSystemEventHandler):
    def on_created(self, event):
        if event.is_directory:
            return
        p = Path(event.src_path)
        if p.name.startswith("."):
            return
        # deja que el equipo termine de escribir
        time.sleep(0.3)
        upload(p)


def main() -> None:
    WATCH_DIR.mkdir(parents=True, exist_ok=True)
    LOG.info("equipo-connect.start", watch=str(WATCH_DIR), upload=UPLOAD_URL, equipo=EQUIPO_ID)
    # Exporta métricas Prometheus localmente
    start_http_server(8900)

    handler = IncomingHandler()
    observer = Observer()
    observer.schedule(handler, str(WATCH_DIR), recursive=False)
    observer.start()

    # Reprocesar archivos ya existentes (scan inicial)
    for existing in WATCH_DIR.iterdir():
        if existing.is_file() and not existing.name.startswith("."):
            upload(existing)

    stop = False

    def handle_sig(*_):
        nonlocal stop
        stop = True
    signal.signal(signal.SIGTERM, handle_sig)
    signal.signal(signal.SIGINT, handle_sig)

    try:
        while not stop:
            time.sleep(1)
    finally:
        observer.stop()
        observer.join()
        LOG.info("equipo-connect.stop")
        sys.exit(0)


if __name__ == "__main__":
    main()
