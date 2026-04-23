-- Labsis MVP seed schema.
-- Run once by Bitnami entrypoint on first boot of pg-primary.
-- Standby mirrors automatically via streaming replication (repmgr).

CREATE SCHEMA IF NOT EXISTS pacientes;
CREATE SCHEMA IF NOT EXISTS muestras;
CREATE SCHEMA IF NOT EXISTS analitico;

-- ------------------------ Pacientes ------------------------
CREATE TABLE IF NOT EXISTS pacientes.paciente (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cedula_madre  TEXT NOT NULL,
  nombre        TEXT NOT NULL,
  apellido      TEXT NOT NULL,
  fecha_nac     DATE NOT NULL,
  peso_kg       NUMERIC(4,2) NOT NULL,
  sexo          CHAR(1)  NOT NULL CHECK (sexo IN ('M','F')),
  hospital      TEXT     NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_paciente_cedmadre ON pacientes.paciente(cedula_madre);

-- Semilla de demostración (paciente de ejemplo del panel Labsis real)
INSERT INTO pacientes.paciente (id, cedula_madre, nombre, apellido, fecha_nac, peso_kg, sexo, hospital)
VALUES ('11111111-1111-1111-1111-111111111111', '4-769-466', 'Sarah', 'Pitti', '2026-03-01', 3.37, 'F', 'Hospital del Niño HJRE')
ON CONFLICT DO NOTHING;

INSERT INTO pacientes.paciente (id, cedula_madre, nombre, apellido, fecha_nac, peso_kg, sexo, hospital)
VALUES ('22222222-2222-2222-2222-222222222222', '8-123-456', 'Heidi', 'Castillo Morales', '2026-04-10', 3.37, 'M', 'Hospital del Niño HJRE')
ON CONFLICT DO NOTHING;

-- ------------------------ Muestras ------------------------
CREATE TABLE IF NOT EXISTS muestras.muestra (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id    UUID NOT NULL REFERENCES pacientes.paciente(id),
  codigo_barras  TEXT UNIQUE NOT NULL,
  estado         TEXT NOT NULL DEFAULT 'RECIBIDA',
  trace_id       TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------ Analítico ------------------------
CREATE TABLE IF NOT EXISTS analitico.resultado (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  muestra_id     UUID NOT NULL REFERENCES muestras.muestra(id),
  analito        TEXT NOT NULL,         -- IRT, TSH, G6PD, NEOPHE, OHP17, TGAL
  valor          NUMERIC(12,4) NOT NULL,
  unidad         TEXT NOT NULL,
  referencia     TEXT NOT NULL,          -- texto descriptivo (p. ej. "< 65 (Negativo)")
  estado         TEXT NOT NULL,          -- AUTOVALIDADO | REVISAR | RECHAZADO
  validado_por   TEXT,                   -- tecnólogo/licenciado
  trace_id       TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_resultado_muestra ON analitico.resultado(muestra_id);
CREATE INDEX IF NOT EXISTS ix_resultado_estado  ON analitico.resultado(estado);

-- ------------------------ Audit (BI / lectura) ------------------------
CREATE OR REPLACE VIEW analitico.v_indicadores AS
SELECT
  DATE_TRUNC('day', created_at)::DATE AS dia,
  COUNT(*)                             AS total,
  COUNT(*) FILTER (WHERE estado = 'AUTOVALIDADO') AS autovalidados,
  COUNT(*) FILTER (WHERE estado = 'REVISAR')       AS a_revisar,
  COUNT(*) FILTER (WHERE estado = 'RECHAZADO')     AS rechazados
FROM analitico.resultado
GROUP BY 1
ORDER BY 1 DESC;
