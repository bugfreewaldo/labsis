# ADR-0003 — Externalizar reglas de autovalidación en OPA

## Estado
Aceptada · 2026-02-20

## Contexto
En Labsis actual, las reglas de autovalidación (rangos de referencia por
analito, umbrales dependientes del peso del neonato, por ejemplo 17-OHP) viven
como código Java dentro del monolito. Un cambio regulatorio o científico
(por ejemplo, ajustar el umbral de TSH) requiere un redeploy completo.

## Decisión
Extraer las reglas a **Open Policy Agent (OPA)** usando el lenguaje Rego.
El `ms-analitico` invoca OPA vía HTTP como un "motor de reglas":

- Las reglas viven en `infra/opa/policies/autovalidacion.rego`, se versionan
  en Git y se despliegan como ConfigMap/volumen montado.
- OPA se ejecuta como un sidecar (o servicio compartido) y responde bajo
  `/v1/data/labsis/autovalidacion`.
- El input incluye el paciente (con `peso_kg`) y la lista de resultados; la
  salida es `{ decision, detalle[] }`.

## Consecuencias
- `+` Cambios regulatorios aplican sin redesplegar el `ms-analitico`.
- `+` Auditoría clara: cada regla versionada en Git.
- `+` Testeable: reglas cubren casos unitarios en Rego.
- `-` Una dependencia de red adicional en el camino crítico; mitigada con
  Resilience4j (Retry + Timeout + Circuit Breaker + Bulkhead) y fallback
  conservador a "REVISAR".

## Referencias
- OPA / Rego.
- Mohammad, *Resilient Microservices*, arXiv:2512.16959 (2025).
