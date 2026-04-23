"""Fallback LLM (Anthropic Claude) para tramas cuyo formato no reconocen los parsers.

La IA se usa exclusivamente para interpretar sintácticamente la trama, nunca
para decidir clínicamente. La decisión clínica (Autovalidado / Revisar) se
mantiene en el motor OPA + el tecnólogo firmante.
"""
from __future__ import annotations

import json
import os
from typing import List, Dict

import structlog
from anthropic import Anthropic

LOG = structlog.get_logger("ia-mapper.llm")

_CLIENT: Anthropic | None = None

SYSTEM_PROMPT = """Eres un extractor de datos de analitos de tamizaje neonatal.
Recibirás texto crudo proveniente de un equipo de laboratorio (archivo plano,
CSV o trama HL7 v2). Debes devolver EXCLUSIVAMENTE un JSON array donde cada
elemento sea una observación con exactamente estos campos:
  - analito: uno de IRT | TSH | G6PD | NEOPHE | OHP17 | TGAL
  - valor: número flotante
  - unidad: string (por ejemplo "ng/mL", "uU/mL", "U/dL", "mg/dL")

Reglas:
- Ignora columnas constantes de control (por ejemplo el valor 110 repetido).
- Ignora líneas de encabezado, separadores de fracciones o marcadores de bloque.
- Si no reconoces un analito, omite la fila (no inventes).
- Devuelve [] si no hay datos reconocibles.
- NO expliques nada. Devuelve solo el JSON.

Ejemplo de respuesta válida:
[{"analito":"IRT","valor":12.8,"unidad":"ng/mL"},{"analito":"TSH","valor":3.1,"unidad":"uU/mL"}]
"""


def _client() -> Anthropic:
    global _CLIENT
    if _CLIENT is None:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError("ANTHROPIC_API_KEY not configured")
        _CLIENT = Anthropic(api_key=api_key)
    return _CLIENT


async def llm_map_to_fhir(text: str, equipo_id: str, trace_id: str) -> List[Dict]:
    """Llama a Claude Haiku para extraer observaciones del texto crudo."""
    try:
        client = _client()
    except RuntimeError as e:
        LOG.warning("llm.disabled", reason=str(e))
        return []

    # prompt caching: systemPrompt fijo se cachea; user varía
    msg = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=2048,
        system=[
            {"type": "text", "text": SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}},
        ],
        messages=[
            {"role": "user", "content": f"equipo_id={equipo_id} trace_id={trace_id}\n\nTRAMA:\n{text[:8000]}"},
        ],
    )

    # Claude puede devolver varios content blocks; tomar el texto concatenado.
    raw = "".join(b.text for b in msg.content if b.type == "text").strip()
    # Recortar posibles code fences
    if raw.startswith("```"):
        raw = raw.strip("`")
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        LOG.error("llm.bad_json", raw=raw[:300])
        return []

    out: List[Dict] = []
    for item in data if isinstance(data, list) else []:
        if not isinstance(item, dict):
            continue
        analito = str(item.get("analito", "")).upper().strip()
        if analito not in {"IRT", "TSH", "G6PD", "NEOPHE", "OHP17", "TGAL"}:
            continue
        try:
            valor = float(item.get("valor"))
        except (TypeError, ValueError):
            continue
        unidad = str(item.get("unidad", "")).strip()
        out.append({"analito": analito, "valor": valor, "unidad": unidad})
    LOG.info("llm.mapped", equipo_id=equipo_id, trace_id=trace_id, n=len(out))
    return out
