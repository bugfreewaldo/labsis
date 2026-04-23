# Labsis MVP-mock

Bosquejo ejecutable de la modernización del sistema Labsis (Programa Nacional
de Tamizaje Neonatal de Panamá), correspondiente al Proyecto Final del curso
**Tópicos Especiales Avanzados en Ingeniería de Software II** (1MW211, V sem
2026, UTP). Equipo: Pittí, Restrepo, Salazar. Facilitador: Prof. Huriviades
Calderón Gómez.

> Este **NO es un reemplazo de producción**. Es un MVP-mock que evidencia
> cómo se vería el Labsis actual descompuesto por razones de **seguridad** y
> **resiliencia**, cubriendo el 50 % del sistema propuesto según los
> lineamientos del proyecto final.

---

## Qué demuestra el MVP

| Dolor actual (producción) | Cómo lo ataca el MVP |
|---|---|
| Monolito con SPOF total: si cae, no hay servicio ni para lab ni para padres | Microservicios + PostgreSQL HA (primary/standby con repmgr); portal lee del standby |
| `InterfazLabsis` CMD: integración 1-a-1 por equipo, canal plano sin TLS | `equipo-connect` (agente zero-trust) + `ia-mapper` (FastAPI + Anthropic) que reconoce formatos heterogéneos |
| 8 placas de 96 pozos procesadas 1 a 1 | Kafka con consumidores paralelos; batch de 768 resultados en segundos |
| Autovalidación cableada en el monolito | Motor de reglas OPA versionado (incluye 17-OHP peso-dependiente) |
| `backup.bat` manual en PC de técnico a las 3 pm | Streaming replication + backup continuo con prueba de restauración automatizada |
| Portal ciudadano acoplado al backend clínico | `ms-portal` (Next.js) desacoplado, lee del standby, tiene su propio ciclo |
| Sin observabilidad | Stack Grafana LGTM (Loki + Grafana + Tempo + Mimir) con OTel Collector |

---

## Arquitectura

```
Equipos --> equipo-connect --HTTP--> ia-mapper --Kafka--> ms-muestras --Kafka--> ms-analitico --> OPA
                                                                                      |
                                                                                      v
                                                                               PostgreSQL Primary
                                                                                      ^ streaming replication
                                                                                      |
                                                                               PostgreSQL Standby <-- ms-bi, ms-portal (lecturas)
```

Detalles en el informe: `../ProyectoFinal/Restrepo_Pitti_Salazar_Grupo1_ProyectoFinal.docx`
(Figuras 2, 3, 5 y 6 documentan la arquitectura, conectividad, observabilidad y despliegue).

---

## Stack

- **Java 21 + Spring Boot 3.3** — `ms-pacientes`, `ms-muestras`, `ms-analitico`, `ms-bi`
- **Python 3.12 + FastAPI** — `ia-mapper`, `equipo-connect`
- **Next.js 14 + NextAuth** — `ms-portal` (OIDC contra Keycloak)
- **PostgreSQL 15 + repmgr** (Bitnami) — primary + standby con failover automático
- **Redpanda** — Kafka-compatible sin ZooKeeper
- **Keycloak 24** — OIDC con realm `labsis` pre-cargado
- **Open Policy Agent (OPA)** — motor de reglas de autovalidación (Rego)
- **MinIO** — almacenamiento S3-compatible para PDFs firmados y backups
- **Grafana LGTM**: Grafana + Prometheus + Loki + Tempo + OTel Collector
- **Resilience4j** — Retry, Timeout, Circuit Breaker, Bulkhead
- **Anthropic Claude Haiku** — mapeo LLM en el `ia-mapper` (fallback)

---

## Requisitos

- Docker 24+ y Docker Compose v2
- 8 GB RAM (16 GB recomendado si vas a cargar una corrida 96x8 completa)
- GNU Make (en Windows: Git Bash o WSL)
- Una clave Anthropic (`ANTHROPIC_API_KEY`) si quieres el fallback LLM. Si no,
  pon `IA_FALLBACK_ONLY=true` en `.env` y el ia-mapper usará sólo parsers
  deterministas.

---

## Arrancar en 3 pasos

```bash
# 1. Configurar entorno (copia el .env.example y pega tu key)
make bootstrap
$EDITOR .env

# 2. Levantar todo
make up

# 3. Inyectar datos y ver fluir el sistema
make seed-sample         # un archivo G6PD.A34 sintético (~6 resultados)
make seed-batch          # corrida completa 8 placas x 96 pozos = 768 resultados
```

Luego abre:

- **Portal ciudadano**: http://localhost:3001
  (usa cédula `4-769-466` para la paciente Sarah Pittí pre-cargada)
- **Grafana**: http://localhost:3000 — `admin/admin`
- **Redpanda Console**: http://localhost:8088 — para ver los topics en vivo
- **Keycloak**: http://localhost:8080 — `admin/admin`
- **OPA**: http://localhost:8181/v1/data/labsis/autovalidacion

---

## Alternativa sin `make`: `docker compose` directo

Si no tienes `make` disponible (PowerShell/CMD nativo en Windows, por ejemplo),
puedes correrlo todo con `docker compose`. El `Makefile` es solo azúcar sobre
estos comandos.

**Dos flags son obligatorios** en cada invocación, porque el `docker-compose.yml`
vive en `compose/` y el `.env` vive en la raíz:

- `-f compose/docker-compose.yml` — ubica el compose file
- `--env-file .env` — carga variables (sin esto, `ANTHROPIC_API_KEY` llega vacío
  al `ia-mapper`; por defecto `docker compose` busca el `.env` al lado del YAML)

### Equivalencias `make` ↔ `docker compose`

Todos los comandos se ejecutan desde la **raíz** del proyecto:

```bash
# make bootstrap → simplemente copia .env.example si hace falta
test -f .env || cp .env.example .env

# make build
docker compose -f compose/docker-compose.yml --env-file .env build

# make up (sin crear topics; ver siguiente paso)
docker compose -f compose/docker-compose.yml --env-file .env up -d

# make topic-init (se corre automáticamente tras `make up`)
docker exec labsis-redpanda rpk topic create \
  raw.ingest normalized.results paciente.creado muestra.recibida \
  resultado.liberado caso.positivo -p 3 -r 1

# make ps
docker compose -f compose/docker-compose.yml --env-file .env ps

# make logs S=ms-analitico
docker compose -f compose/docker-compose.yml --env-file .env logs -f ms-analitico

# make restart S=ms-analitico
docker compose -f compose/docker-compose.yml --env-file .env restart ms-analitico

# make down (conserva volúmenes)
docker compose -f compose/docker-compose.yml --env-file .env down

# make clean (borra volúmenes, base de datos vacía)
docker compose -f compose/docker-compose.yml --env-file .env down -v
```

### Alias recomendado

Para no repetir los dos flags en cada comando, exporta un alias en tu shell:

```bash
# Git Bash / WSL / Linux / macOS
alias dc='docker compose -f compose/docker-compose.yml --env-file .env'

# Luego:
dc up -d
dc ps
dc logs -f ms-analitico
dc down
```

```powershell
# PowerShell (añádelo a tu $PROFILE para persistirlo)
function dc { docker compose -f compose/docker-compose.yml --env-file .env @args }

dc up -d
dc ps
dc logs -f ms-analitico
dc down
```

### Scripts auxiliares

Los `make seed-*`, `make chaos-*` y `make backup-test` son solo wrappers de
scripts bash. Puedes invocarlos directo (requieren Git Bash o WSL en Windows
porque son `.sh`):

```bash
bash scripts/seed-sample.sh           # = make seed-sample
bash scripts/seed-batch-96.sh         # = make seed-batch
bash scripts/chaos-kill-primary.sh    # = make chaos-kill-primary
bash scripts/chaos-restore-primary.sh # = make chaos-restore
bash scripts/chaos-latency-ia.sh on   # = make chaos-latency-on
bash scripts/chaos-latency-ia.sh off  # = make chaos-latency-off
bash scripts/backup-test.sh           # = make backup-test
```

---

## Demos de resiliencia (para la exposición)

### 1. Failover de PostgreSQL
```bash
make chaos-kill-primary
# Observa:
#   - Portal sigue sirviendo resultados (lee del standby) → http://localhost:3001/buscar?cedula=4-769-466
#   - ms-bi sigue respondiendo → curl http://localhost:8104/indicadores/resumen
make chaos-restore
```

### 2. Circuit Breaker en ms-analitico cuando ia-mapper (o OPA) degrada
```bash
make chaos-latency-on      # inyecta 3s de latencia a ia-mapper
# Observa en Grafana el CB transitando a OPEN
# y el contador labsis_analitico_revisar_total aumentando por el fallback
make chaos-latency-off
```

### 3. Reemplazo del backup.bat
```bash
make backup-test
# Muestra dump + restauración + verificación en un clúster efímero
```

### 4. Ingesta inteligente
```bash
# Simula un equipo nuevo con formato nunca visto: el ia-mapper
# (con ANTHROPIC_API_KEY configurada) lo normaliza sin desarrollo ad-hoc.
echo "IRT=12.8 ng/mL; TSH=3.1 uU/mL; G6PD=49.7 U/dL" > samples/incoming/equipo_nuevo.txt
# Observa los logs: docker logs -f labsis-ia-mapper
```

---

## Estructura

```
labsis-mvp/
├── compose/              docker-compose.yml principal
├── services/
│   ├── equipo-connect/   Python watcher + firma + cliente HTTPS
│   ├── ia-mapper/        FastAPI + parsers deterministas + Anthropic fallback
│   ├── ms-pacientes/     Spring Boot 3 · identidad del neonato
│   ├── ms-muestras/      Spring Boot 3 · ciclo de vida de muestra (Kafka consumer)
│   ├── ms-analitico/     Spring Boot 3 · autovalidación vía OPA + Resilience4j
│   ├── ms-bi/            Spring Boot 3 · lectura del standby (CQRS ligera)
│   └── ms-portal/        Next.js 14 · portal ciudadano desacoplado
├── infra/
│   ├── postgres/init/    SQL de esquema inicial
│   ├── keycloak/         realm export pre-configurado
│   ├── opa/policies/     Rego: reglas de autovalidación (17-OHP peso-dep, etc.)
│   ├── otel-collector/   pipelines traces/metrics/logs
│   ├── prometheus/       scrape config
│   └── grafana-lgtm/     tempo.yaml, provisioning, dashboards
├── samples/
│   ├── incoming/         directorio observado por equipo-connect
│   ├── hl7/              trama HL7 v2 de ejemplo
│   └── sample_G6PD.A34.template
├── scripts/              seed + chaos + backup-test
├── docs/adr/             Architecture Decision Records
├── Makefile
├── .env.example
└── README.md
```

---

## Notas académicas

El diseño, las decisiones arquitectónicas y la justificación extensa viven en
el informe: `Restrepo_Pitti_Salazar_Grupo1_ProyectoFinal.docx` (41 referencias
IEEE incluyendo el material de Unidades I–V del Prof. Huriviades Calderón
Gómez, y su paper de SOA vs MSA en eHealth [*Applied Sciences* 11:4350, 2021]
que ancla la comparativa monolito/microservicios).

---

## Licencia

Uso académico interno UTP. Datos clínicos son sintéticos.
