#!/bin/bash
# Standby bootstrap wrapper for the official postgres:15 image.
#
# On first boot the data dir is empty, so we clone the primary with
# pg_basebackup -R (which writes standby.signal + primary_conninfo into
# postgresql.auto.conf). Subsequent boots just skip the clone and let
# postgres start in streaming-replica mode against the existing data dir.
set -e

PGDATA_DIR="${PGDATA:-/var/lib/postgresql/data}"

if [ ! -s "$PGDATA_DIR/PG_VERSION" ]; then
  echo "[standby-init] Empty data dir, cloning from pg-primary via pg_basebackup..."
  until PGPASSWORD="$REPLICATION_PASSWORD" gosu postgres pg_basebackup \
      -h pg-primary -p 5432 -U replicator \
      -D "$PGDATA_DIR" -Fp -Xs -P -R -w; do
    echo "[standby-init] Primary not reachable yet, retrying in 3s..."
    sleep 3
  done
  echo "[standby-init] Base backup complete; standby.signal present."
fi

exec docker-entrypoint.sh "$@"
