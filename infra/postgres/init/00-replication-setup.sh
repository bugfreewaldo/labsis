#!/bin/bash
# Runs once, on first boot of pg-primary, via postgres's docker-entrypoint.
# Creates the replication role used by pg-standby's pg_basebackup and
# opens pg_hba to replication connections from the labsis docker network.
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD '${REPLICATION_PASSWORD}';
EOSQL

cat >> "$PGDATA/pg_hba.conf" <<-EOF
	host replication replicator 0.0.0.0/0 md5
	host replication replicator ::/0      md5
EOF
