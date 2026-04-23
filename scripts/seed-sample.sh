#!/usr/bin/env bash
# Inyecta un archivo G6PD.A34 sintético en el directorio observado por equipo-connect.
# equipo-connect lo detectará, firmará y enviará al ia-mapper, que a su vez publicará
# en Kafka y disparará ms-muestras -> ms-analitico -> OPA -> persistencia.
set -euo pipefail

HERE="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$HERE/samples/sample_G6PD.A34.template"
STAMP="$(date +%Y%m%d_%H%M%S)"
DEST="$HERE/samples/incoming/G6PD.A34.${STAMP}"

cp "$SRC" "$DEST"
echo "Dropped sample at $DEST"
echo "Watch ia-mapper logs: docker logs -f labsis-ia-mapper"
