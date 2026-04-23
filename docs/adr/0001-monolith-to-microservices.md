# ADR-0001 — Descomposición del monolito Labsis en microservicios

## Estado
Aceptada · 2026-02-10

## Contexto
Labsis en producción (Seam/Java EE, Laboratory Technologies Inc.) opera como
un monolito que combina operación clínica del laboratorio y portal ciudadano.
Una caída deja a ambos sin servicio. El MINSA ha manifestado que la
continuidad del servicio de consulta ciudadana no puede depender del mismo
artefacto que corre la autovalidación.

## Decisión
Descomponer en microservicios por bounded context (Pacientes, Muestras,
Analítico, BI, Portal, Notificaciones). Cada servicio:
- se despliega de forma independiente,
- publica y consume eventos vía Kafka,
- persiste en su propio schema de PostgreSQL (base de datos compartida,
  schemas separados, para el MVP; una migración futura podría separar en
  bases independientes).

## Consecuencias
- `+` Escalabilidad selectiva, aislamiento de fallos, time-to-market rápido.
- `+` El portal ciudadano puede seguir sirviendo lecturas del standby aun si
  el núcleo clínico cae.
- `-` Complejidad operativa mayor (plataforma Kubernetes, observabilidad,
  bus de eventos, OPA).
- `-` Obliga a pensar en consistencia eventual y compensación de
  transacciones.

## Referencias
- Calderón-Gómez et al., *Applied Sciences* 11:4350 (2021) — SOA vs MSA en eHealth.
- Blinowski et al., *IEEE Access* 10:20357-20374 (2022).
- Newman, *Building Microservices*, 2e (2021).
