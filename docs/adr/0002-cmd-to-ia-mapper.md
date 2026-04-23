# ADR-0002 — Reemplazo de la `InterfazLabsis` CMD por ia-mapper + equipo-connect

## Estado
Aceptada · 2026-02-15

## Contexto
En producción, cada equipo de laboratorio tiene una ventana CMD dedicada
("InterfazLabsis") que lee archivos planos (por ejemplo `G6PD.A34`, ancho
fijo) desde un directorio compartido y los envía por TCP plano al servidor.
Añadir un nuevo equipo exige analizar su trama y desarrollar un conector
específico, proceso que toma semanas. Además, el canal carece de TLS y de
autenticación mutua.

## Decisión
1. Desplegar `equipo-connect`, un agente liviano por PC de laboratorio que:
   - observa el directorio de salida del equipo,
   - firma el archivo con SHA-256 y marca temporal,
   - lo envía al `ia-mapper` vía HTTPS/mTLS (HTTP plano en el MVP local).
2. Todas las tramas desembocan en `ia-mapper` (FastAPI), que:
   - aplica primero parsers deterministas por firma de formato (ancho fijo,
     CSV, HL7 v2),
   - si ninguno encaja, invoca Anthropic Claude Haiku con un prompt acotado
     y validación estricta del JSON resultante,
   - publica el DiagnosticReport FHIR R5 en Kafka.
3. La identidad del equipo se emite por `cert-manager` (en K8s) y se
   propaga como header.

## Consecuencias
- `+` Incorporar un equipo nuevo pasa de semanas a horas de configuración.
- `+` El canal se vuelve autenticado, cifrado y auditado.
- `+` La IA queda acotada a interpretación sintáctica; la decisión clínica
  permanece en OPA + tecnólogo.
- `-` Dependencia operativa de una API externa (Anthropic) como fallback;
  mitigado con `IA_FALLBACK_ONLY=true` y parsers deterministas.
- `-` Mayor complejidad local por un agente extra en cada PC de laboratorio.

## Referencias
- HL7 FHIR R5.
- Prof. Huriviades, PPT Unidad I: Salud 4.0 → Salud 5.0.
