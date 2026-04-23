"""Parsers deterministas para formatos conocidos del ecosistema Labsis.

Los archivos G6PD.A34 observados en producción tienen forma tabular de ancho
fijo: cada línea es una observación con columnas separadas por espacios
múltiples. El formato no es un estándar público y puede variar entre equipos,
por eso si una línea no encaja, se ignora y el ia-mapper cae al fallback LLM.
"""
from __future__ import annotations

import re
from typing import List, Dict

ANALYTE_ALIASES = {
    "IRT": "IRT",
    "TSH": "TSH",
    "G6PD": "G6PD",
    "NEOPHE": "NEOPHE",
    "PHE": "NEOPHE",
    "17OHP": "OHP17",
    "17-OHP": "OHP17",
    "OHP17": "OHP17",
    "TGAL": "TGAL",
}

UNITS = {
    "IRT": "ng/mL",
    "TSH": "uU/mL",
    "G6PD": "U/dL",
    "NEOPHE": "mg/dL",
    "OHP17": "ng/mL",
    "TGAL": "mg/dL",
}


def _std_analyte(token: str) -> str | None:
    t = token.strip().upper().replace(" ", "")
    return ANALYTE_ALIASES.get(t)


def parse_plain_fixed_width(text: str) -> List[Dict]:
    """Parser para archivos tipo G6PD.A34 (ancho fijo, columnas separadas por >=2 espacios).

    Heurística: busca líneas que tengan un código de analito reconocido y un
    número flotante en el mismo registro. Ignora líneas de encabezado o
    marcadores de Fracción. Los campos de fecha/hora se ignoran en el MVP.
    """
    results: List[Dict] = []
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.lower().startswith(("fraccion", "fracción", "enviando", "bloque")):
            continue
        # Divide por 2+ espacios
        fields = re.split(r"\s{2,}", line)
        analito = None
        valor = None
        for f in fields:
            std = _std_analyte(f)
            if std:
                analito = std
            # Captura un float simple; prioriza valores con decimal
            m = re.fullmatch(r"[+-]?\d+(?:\.\d+)?", f.strip())
            if m and valor is None:
                # Evita confundir el "110" que aparece siempre como constante
                v = float(f.strip())
                if v != 110.0:
                    valor = v
        if analito and valor is not None:
            results.append({
                "analito": analito,
                "valor": valor,
                "unidad": UNITS.get(analito, ""),
            })
    if not results:
        raise ValueError("fwf: no recognized analyte lines")
    return results


def parse_csv_labsis(text: str) -> List[Dict]:
    """CSV con encabezados analito,valor,unidad. Todas las columnas opcionales excepto analito y valor."""
    import csv
    from io import StringIO

    results: List[Dict] = []
    reader = csv.DictReader(StringIO(text))
    for row in reader:
        a = _std_analyte((row.get("analito") or "").strip())
        if not a:
            continue
        try:
            v = float((row.get("valor") or "").strip())
        except ValueError:
            continue
        results.append({
            "analito": a,
            "valor": v,
            "unidad": (row.get("unidad") or UNITS.get(a, "")).strip(),
        })
    if not results:
        raise ValueError("csv: no valid rows")
    return results


def parse_hl7_v2(text: str) -> List[Dict]:
    """Parser mínimo HL7 v2 para segmentos OBX (Observation).

    Formato OBX esperado:
      OBX|set_id|value_type|obs_id^text|sub_id|value|unit|range|abnormal|...
    """
    results: List[Dict] = []
    for line in text.splitlines():
        if not line.startswith("OBX|"):
            continue
        fields = line.split("|")
        if len(fields) < 6:
            continue
        obs_id = fields[3].split("^")[0] if "^" in fields[3] else fields[3]
        analito = _std_analyte(obs_id)
        if not analito:
            continue
        try:
            valor = float(fields[5])
        except ValueError:
            continue
        unidad = fields[6] if len(fields) > 6 else UNITS.get(analito, "")
        results.append({"analito": analito, "valor": valor, "unidad": unidad})
    if not results:
        raise ValueError("hl7: no OBX with recognized analyte")
    return results
