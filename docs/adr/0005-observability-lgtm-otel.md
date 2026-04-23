# ADR-0005 — Stack de observabilidad: OpenTelemetry + Grafana LGTM

## Estado
Aceptada · 2026-02-25

## Contexto
Labsis actual sólo emite logs planos en ficheros, sin métricas ni trazas
distribuidas. El diagnóstico es reactivo, posterior al fallo, y no existe
correlación entre señales. El RNF5 exige MTTR ≤ 10 min.

## Decisión
Adoptar **OpenTelemetry** como SDK único en todos los microservicios, con
un **OTel Collector** (DaemonSet en K8s, contenedor en el MVP) que recibe
OTLP y enruta:
- Métricas → Prometheus
- Logs → Loki
- Trazas → Tempo

Grafana unifica la visualización. Cada request cruza el sistema con
`trace_id` propagado (W3C Trace Context) para permitir navegar desde una
alerta a una traza, y desde una traza a los logs del span.

## Consecuencias
- `+` Cobertura de los tres pilares con un SDK único.
- `+` Posibilidad de formular preguntas nuevas sin redesplegar (la
  información está disponible).
- `+` SLOs y error-budget monitorizables.
- `-` Overhead de instrumentación y de red en el Collector.
- `-` Curva de aprendizaje en correlación entre señales.

## Referencias
- Borges et al., ICSA 2024 (arXiv:2403.00633).
- Albuquerque & Correia, arXiv:2510.02991 (2025).
- Majors, *Observability Engineering* (2022).
