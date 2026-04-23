# ADR-0004 — PostgreSQL 15 en HA con repmgr (Bitnami) y reemplazo del backup.bat

## Estado
Aceptada · 2026-02-22

## Contexto
Labsis actual corre en un único PostgreSQL sin réplica. El respaldo es un
`backup.bat` ejecutado manualmente a las 3 pm desde la PC de un técnico.
Esto genera un RPO de 24 h y una custodia del respaldo fuera de
infraestructura administrada. No existen pruebas automatizadas de
restauración.

## Decisión
1. Clúster `primary + standby` con streaming replication, usando la imagen
   Bitnami `postgresql-repmgr:15`.
2. `ms-bi` y `ms-portal` leen del **standby**, ejemplificando CQRS ligera:
   escrituras al primary, lecturas analíticas al standby.
3. Estrategia de backup automatizada:
   - dump con `pg_dump` (MVP) o `pgBackRest` (producción) contra MinIO/S3.
   - archivado continuo de WAL.
   - prueba de restauración semanal en un clúster efímero.
4. Runbooks documentados en `docs/runbook-dr.md` (TODO).

## Consecuencias
- `+` RTO ≤ 60 s con promoción automática del standby.
- `+` RPO ≤ 5 s (streaming) frente a las 24 h del backup.bat.
- `+` El portal ciudadano sobrevive a la caída del primary (demostrado en
  `make chaos-kill-primary`).
- `-` Doble huella de almacenamiento.
- `-` Operar el failover requiere runbooks claros.

## Referencias
- PostgreSQL 15 Docs: High Availability, Load Balancing, and Replication.
- Beyer et al., *Site Reliability Engineering* (2016).
