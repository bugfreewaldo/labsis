#!/usr/bin/env bash
# Demo automatizada para la exposición: 5 minutos, 5 actos.
# Asume 'make up' ya ejecutado y stack saludable.
#
#   Acto 1 (0:00 – 0:45)  Hola mundo: una trama, un resultado.
#   Acto 2 (0:45 – 1:45)  Batch 8x96 (768 resultados) + autovalidación.
#   Acto 3 (1:45 – 3:00)  17-OHP peso-dependiente: misma data, regla nueva.
#   Acto 4 (3:00 – 4:00)  Chaos: latencia en ia-mapper -> CB abierto -> fallback.
#   Acto 5 (4:00 – 5:00)  Chaos: kill pg-primary -> portal sigue viva.

set -euo pipefail
GREEN=$'\033[0;32m'; YELLOW=$'\033[0;33m'; CYAN=$'\033[0;36m'; RED=$'\033[0;31m'; NC=$'\033[0m'
HERE="$(cd "$(dirname "$0")/.." && pwd)"

say() { echo; printf "${CYAN}▶ %s${NC}\n" "$*"; }
act() { echo; printf "${GREEN}═══ %s ═══${NC}\n" "$*"; sleep 2; }
wait_s() { local s=$1; for i in $(seq "$s" -1 1); do printf "   ${YELLOW}esperando %ds...  \r${NC}" "$i"; sleep 1; done; printf "\n"; }

check_up() {
  if ! docker ps --format '{{.Names}}' | grep -q "labsis-ia-mapper"; then
    printf "${RED}Stack no está arriba. Corre 'make up' primero.${NC}\n"; exit 1
  fi
}

check_up

act "Acto 1 (0:00) — Bienvenida"
say "Labsis MVP-mock. 20 contenedores corriendo."
docker ps --format 'table {{.Names}}\t{{.Status}}' | grep labsis | head -10
wait_s 5

say "Abrimos el portal ciudadano: http://localhost:3001"
say "Abrimos Grafana:             http://localhost:3000 (admin/admin)"
say "Abrimos Redpanda Console:    http://localhost:8088"
wait_s 10

act "Acto 2 (0:45) — Reemplazo de la InterfazLabsis CMD"
say "Dejamos un archivo G6PD.A34 sintético en samples/incoming/..."
bash "$HERE/scripts/seed-sample.sh"

say "equipo-connect lo firma y envía a ia-mapper via HTTP (en prod: mTLS)."
say "ia-mapper lo interpreta (parser determinista o Claude Haiku) y publica en Kafka."
say "ms-muestras y ms-analitico consumen y autovalidan vía OPA."
wait_s 8

say "Resultado en base de datos:"
docker exec labsis-pg-primary psql -U labsis -d labsis -c \
  "SELECT analito, valor, unidad, estado FROM analitico.resultado ORDER BY created_at DESC LIMIT 10"
wait_s 5

act "Acto 3 (1:45) — Batch 8 placas x 96 pozos = 768 resultados"
say "Simulamos una corrida real del laboratorio..."
bash "$HERE/scripts/seed-batch-96.sh" > /dev/null
wait_s 15

say "Kafka procesó el lote en paralelo. Contando:"
docker exec labsis-pg-primary psql -U labsis -d labsis -c \
  "SELECT estado, COUNT(*) FROM analitico.resultado GROUP BY estado"

say "En Grafana > Labsis MVP > 1. Overview se ve el throughput RED/USE."
wait_s 5

act "Acto 4 (3:00) — 17-OHP peso-dependiente"
say "Cargamos manualmente un resultado 17-OHP con peso 2.3 kg (umbral <= 73):"
curl -sf -X POST http://localhost:8200/ingest \
  -F equipo_id=DEMO-17OHP \
  -F file=@<(printf "OBX|1|NM|OHP17^17-OHP|1|45|ng/mL|<=73|N|||F\n") 2>/dev/null || \
  echo "OBX|1|NM|OHP17^17-OHP|1|45|ng/mL|<=73|N|||F" | \
  curl -sf -X POST http://localhost:8200/ingest \
    -F equipo_id=DEMO-17OHP -F file=@- > /tmp/resp.json || true
cat /tmp/resp.json 2>/dev/null || echo "(request sent)"
wait_s 5

say "Con peso 2.3 kg el umbral es <= 73: AUTOVALIDADO."
say "Si el peso fuera >= 2.5 kg con el mismo valor 45, pasaría a REVISAR."
say "La regla vive en OPA: infra/opa/policies/autovalidacion.rego"
say "Cambiarla NO requiere redeploy de ms-analitico."
wait_s 8

act "Acto 5 (4:00) — Caos: latencia en ia-mapper -> Circuit Breaker"
say "Inyectando 3s de latencia..."
bash "$HERE/scripts/chaos-latency-ia.sh" on > /dev/null 2>&1 || true
wait_s 8

say "Estado de los Circuit Breakers de ms-analitico:"
curl -s http://localhost:8103/actuator/circuitbreakers 2>/dev/null || echo "(actuator no disponible aún)"
wait_s 6

say "Quitamos la latencia..."
bash "$HERE/scripts/chaos-latency-ia.sh" off > /dev/null 2>&1 || true
wait_s 3

act "Acto 5b (4:30) — Caos: kill pg-primary"
say "Detenemos el primary (simulamos caída total del servidor de base de datos)..."
docker stop labsis-pg-primary > /dev/null
wait_s 8

say "El portal ciudadano lee del STANDBY. Debe seguir respondiendo:"
curl -s -o /dev/null -w "  portal HTTP: %{http_code}\n" http://localhost:3001/buscar?cedula=4-769-466 || true
curl -s http://localhost:8104/indicadores/resumen | head -c 250 || true
echo

say "En producción esto significa: aunque caiga el lab, los padres siguen viendo"
say "los resultados ya liberados. El sistema 'falla bien'."
wait_s 6

say "Restauramos pg-primary..."
docker start labsis-pg-primary > /dev/null
wait_s 4

printf "\n${GREEN}Demo terminada.${NC}\n"
printf "Abre Grafana y repasa los paneles:\n"
printf "  http://localhost:3000/d/labsis-overview\n"
printf "  http://localhost:3000/d/labsis-ingesta\n"
printf "  http://localhost:3000/d/labsis-resiliencia\n"
