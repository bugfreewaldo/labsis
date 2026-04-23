#!/usr/bin/env bash
# Inyecta latencia artificial en ia-mapper para disparar Circuit Breaker en ms-analitico.
# Usa tc-netem dentro del contenedor.
set -euo pipefail

CMD="${1:-on}"
case "$CMD" in
  on)
    echo "[chaos] Adding 3000ms latency to ia-mapper"
    docker exec -u root labsis-ia-mapper sh -c "apt-get update >/dev/null && apt-get install -y iproute2 >/dev/null && tc qdisc add dev eth0 root netem delay 3000ms" || true
    ;;
  off)
    echo "[chaos] Removing latency from ia-mapper"
    docker exec -u root labsis-ia-mapper sh -c "tc qdisc del dev eth0 root netem" || true
    ;;
  *)
    echo "Usage: $0 [on|off]"; exit 1 ;;
esac
