#!/usr/bin/env bash
set -euo pipefail
echo "[chaos] Starting labsis-pg-primary..."
docker start labsis-pg-primary
echo "[chaos] Wait a few seconds; repmgr will re-sync the cluster."
