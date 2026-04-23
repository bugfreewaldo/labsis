#!/usr/bin/env bash
# Simula una corrida real de tamizaje: 8 placas x 96 pozos = 768 resultados.
# Genera 8 archivos G6PD.A34 sintéticos con valores variando dentro y fuera de rango
# para ejercitar la autovalidación OPA (Autovalidado / Revisar).
set -euo pipefail

HERE="$(cd "$(dirname "$0")/.." && pwd)"
INC="$HERE/samples/incoming"
mkdir -p "$INC"

for plate in $(seq 1 8); do
  FILE="$INC/corrida_P${plate}_$(date +%H%M%S).A34"
  {
    echo "# Placa $plate, 96 pozos sintéticos"
    for well in $(seq 1 96); do
      # valores mayormente dentro de rango; ~5% fuera para poblar REVISAR
      if (( RANDOM % 20 == 0 )); then
        TSH_V="18.5"; G6PD_V="12"; NEOPHE_V="3.2"
      else
        TSH_V=$(awk -v r=$RANDOM 'BEGIN{printf "%.2f", 1 + r/32768*10}')
        G6PD_V=$(awk -v r=$RANDOM 'BEGIN{printf "%.2f", 30 + r/32768*50}')
        NEOPHE_V=$(awk -v r=$RANDOM 'BEGIN{printf "%.2f", 0.3 + r/32768*1.5}')
      fi
      printf "11667  %s  GSP-20210465  764798  1947647981008565  1  %-3d  TSH    8991  1  A   %s   000000   %s\n" \
        "$(date +"%m/%d/%Y %I:%M:%S %p")" "$well" "$TSH_V" "$TSH_V"
      printf "11667  %s  GSP-20210465  764798  1947647981008565  1  %-3d  G6PD   8991  1  B   %s   000000   %s\n" \
        "$(date +"%m/%d/%Y %I:%M:%S %p")" "$well" "$G6PD_V" "$G6PD_V"
      printf "11667  %s  GSP-20210465  764798  1947647981008565  1  %-3d  NEOPHE 8991  1  C   %s   000000   %s\n" \
        "$(date +"%m/%d/%Y %I:%M:%S %p")" "$well" "$NEOPHE_V" "$NEOPHE_V"
    done
  } > "$FILE"
  echo "Dropped $FILE ($(wc -l < "$FILE") lines)"
done
echo "Done. equipo-connect picking up 8 plates = 768 wells x 3 analytes."
