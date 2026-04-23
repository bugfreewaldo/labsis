#!/usr/bin/env bash
# Simula un fallo total del primary de PostgreSQL para observar:
# 1) Que repmgr promueve automáticamente el standby.
# 2) Que ms-bi y ms-portal (lectores del standby) continúan operando.
# 3) Que los microservicios que escriben contra el primary entran en CB abierto
#    y disparan fallbacks visibles en Grafana.
set -euo pipefail

echo "[chaos] Stopping labsis-pg-primary..."
docker stop labsis-pg-primary
echo "[chaos] Primary stopped. Observe:"
echo "  - Grafana: http://localhost:3000 (dashboard 'Labsis MVP — Overview')"
echo "  - Portal : http://localhost:3001/buscar?cedula=4-769-466 (debe responder desde standby)"
echo "  - BI     : curl http://localhost:8104/indicadores/resumen (standby)"
echo "  - CB     : curl http://localhost:8103/actuator/circuitbreakers"
echo
echo "Para restaurar: ./scripts/chaos-restore-primary.sh"
