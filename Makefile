SHELL := /bin/bash
COMPOSE := docker compose -f compose/docker-compose.yml --env-file .env

.PHONY: help up down build logs ps restart bootstrap seed-sample seed-batch \
        chaos-kill-primary chaos-restore chaos-latency-on chaos-latency-off \
        backup-test topic-init clean demo

help:
	@echo "Labsis MVP-mock — targets disponibles:"
	@echo ""
	@echo "  make bootstrap              crea topics Kafka y prepara Keycloak/OPA (idempotente)"
	@echo "  make up                     levanta todo el stack"
	@echo "  make down                   detiene el stack (mantiene volúmenes)"
	@echo "  make build                  fuerza rebuild de todas las imágenes"
	@echo "  make logs S=ms-analitico    sigue logs de un servicio"
	@echo "  make ps                     lista contenedores"
	@echo ""
	@echo "  make seed-sample            deja un G6PD.A34 sintético (1 archivo)"
	@echo "  make seed-batch             simula 8 placas x 96 pozos (768 resultados)"
	@echo ""
	@echo "  make chaos-kill-primary     detiene pg-primary (ver failover)"
	@echo "  make chaos-restore          reinicia pg-primary"
	@echo "  make chaos-latency-on       inyecta 3s de latencia a ia-mapper (abre CB)"
	@echo "  make chaos-latency-off      restaura latencia normal"
	@echo ""
	@echo "  make backup-test            demuestra reemplazo del backup.bat manual"
	@echo "  make demo                   exposición automática de 5 minutos (5 actos)"
	@echo ""
	@echo "URLs útiles una vez levantado:"
	@echo "  Portal ciudadano           http://localhost:3001"
	@echo "  Grafana                    http://localhost:3000  (admin/admin)"
	@echo "  Keycloak                   http://localhost:8080  (admin/admin)"
	@echo "  Redpanda Console           http://localhost:8088"
	@echo "  MinIO Console              http://localhost:9001  (labsis/labsis123)"
	@echo "  Prometheus                 http://localhost:9090"
	@echo "  OPA API                    http://localhost:8181"
	@echo "  ms-pacientes               http://localhost:8101/actuator"
	@echo "  ms-muestras                http://localhost:8102/actuator"
	@echo "  ms-analitico               http://localhost:8103/actuator/circuitbreakers"
	@echo "  ms-bi                      http://localhost:8104/indicadores/resumen"
	@echo "  ia-mapper                  http://localhost:8200/health"

bootstrap:
	@test -f .env || cp .env.example .env
	@echo "Bootstrap OK. Edit .env to set ANTHROPIC_API_KEY before 'make up'."

build:
	$(COMPOSE) build

up:
	$(COMPOSE) up -d
	@sleep 3
	@$(MAKE) topic-init
	@echo ""
	@echo "Stack up. Run 'make seed-sample' or 'make seed-batch' to push data."

down:
	$(COMPOSE) down

logs:
	@$(COMPOSE) logs -f $(S)

ps:
	$(COMPOSE) ps

restart:
	$(COMPOSE) restart $(S)

topic-init:
	@echo "Creating Kafka topics (idempotent)..."
	@docker exec labsis-redpanda rpk topic create raw.ingest normalized.results paciente.creado muestra.recibida resultado.liberado caso.positivo -p 3 -r 1 2>/dev/null || true

seed-sample:
	bash scripts/seed-sample.sh

seed-batch:
	bash scripts/seed-batch-96.sh

chaos-kill-primary:
	bash scripts/chaos-kill-primary.sh

chaos-restore:
	bash scripts/chaos-restore-primary.sh

chaos-latency-on:
	bash scripts/chaos-latency-ia.sh on

chaos-latency-off:
	bash scripts/chaos-latency-ia.sh off

backup-test:
	bash scripts/backup-test.sh

demo:
	bash scripts/demo.sh

clean:
	$(COMPOSE) down -v
	@rm -f samples/incoming/*.A34 samples/incoming/G6PD.A34.* 2>/dev/null || true
