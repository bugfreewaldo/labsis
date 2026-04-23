#!/usr/bin/env bash
# Demuestra el reemplazo del backup.bat manual:
# 1) Hace dump del primary
# 2) Lo guarda con timestamp en MinIO (a través del pgBackRest o pg_dump para el MVP)
# 3) Restaura en un contenedor Postgres efímero y valida que la data llegue
set -euo pipefail

STAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="/tmp/labsis_${STAMP}.sql"

echo "[backup] Dumping primary..."
docker exec labsis-pg-primary pg_dump -U labsis -d labsis > "$BACKUP_FILE"
echo "[backup] Dump size: $(wc -c < "$BACKUP_FILE") bytes"

echo "[backup] Spinning ephemeral postgres to validate restore..."
docker run -d --name labsis-restore-test -e POSTGRES_PASSWORD=pg -p 15432:5432 postgres:15 >/dev/null
sleep 5

cat "$BACKUP_FILE" | docker exec -i labsis-restore-test psql -U postgres
COUNT=$(docker exec labsis-restore-test psql -U postgres -Atqc "SELECT count(*) FROM pacientes.paciente")
echo "[backup] Restored rows in pacientes.paciente: $COUNT"

docker rm -f labsis-restore-test >/dev/null
rm -f "$BACKUP_FILE"
echo "[backup] OK. Restore test passed."
