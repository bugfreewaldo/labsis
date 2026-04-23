import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://labsis:labsis@pg-standby:5432/labsis'
});

async function getResultados(cedula: string) {
  const q = `
    SELECT r.analito, r.valor, r.unidad, r.referencia, r.estado,
           r.created_at, p.nombre, p.apellido, p.peso_kg, p.fecha_nac
      FROM analitico.resultado r
      JOIN muestras.muestra m ON m.id = r.muestra_id
      JOIN pacientes.paciente p ON p.id = m.paciente_id
     WHERE p.cedula_madre = $1
     ORDER BY r.created_at DESC
     LIMIT 50
  `;
  try {
    const res = await pool.query(q, [cedula]);
    return { rows: res.rows, error: null as string | null };
  } catch (e: any) {
    return { rows: [] as any[], error: e.message as string };
  }
}

export default async function BuscarPage({
  searchParams
}: {
  searchParams: { cedula?: string; fecha?: string };
}) {
  const cedula = searchParams.cedula ?? '';
  const { rows, error } = cedula ? await getResultados(cedula) : { rows: [], error: null };

  return (
    <div>
      <h1>Resultados</h1>
      <p>Cédula de la madre: <strong>{cedula}</strong></p>

      {error && (
        <div style={{ background: '#fff3cd', border: '1px solid #ffc107', padding: '1rem', marginBottom: '1rem' }}>
          <strong>Servicio degradado:</strong> {error}
          <div style={{ marginTop: '.5rem' }}>
            (En este bosquejo, si el <em>standby</em> también está caído verás este mensaje;
            lo normal es que el portal siga funcionando al fallar el primary.)
          </div>
        </div>
      )}

      {rows.length === 0 && !error && (
        <p>No hay resultados publicados para esa cédula. (Ejecuta <code>make seed-sample</code> para datos de demostración.)</p>
      )}

      {rows.length > 0 && (
        <>
          <p>
            Paciente: <strong>{rows[0].nombre} {rows[0].apellido}</strong> ·
            Peso: {rows[0].peso_kg} kg · Nacimiento: {new Date(rows[0].fecha_nac).toLocaleDateString('es-PA')}
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
            <thead>
              <tr style={{ background: '#1F4E79', color: '#fff' }}>
                <th style={{ padding: '.5rem' }}>Analito</th>
                <th style={{ padding: '.5rem' }}>Valor</th>
                <th style={{ padding: '.5rem' }}>Unidad</th>
                <th style={{ padding: '.5rem' }}>Referencia</th>
                <th style={{ padding: '.5rem' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '.5rem' }}>{r.analito}</td>
                  <td style={{ padding: '.5rem' }}>{r.valor}</td>
                  <td style={{ padding: '.5rem' }}>{r.unidad}</td>
                  <td style={{ padding: '.5rem' }}>{r.referencia}</td>
                  <td style={{ padding: '.5rem' }}>
                    <Pill estado={r.estado} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      <p style={{ marginTop: '2rem' }}>
        <a href="/" style={{ color: '#1F4E79' }}>&larr; Volver</a>
      </p>
    </div>
  );
}

function Pill({ estado }: { estado: string }) {
  const colors: Record<string, string> = {
    AUTOVALIDADO: '#16a34a',
    REVISAR: '#ca8a04',
    RECHAZADO: '#dc2626'
  };
  return (
    <span style={{
      background: colors[estado] ?? '#6b7280',
      color: '#fff',
      padding: '.15rem .5rem',
      borderRadius: 12,
      fontSize: '.85rem'
    }}>{estado}</span>
  );
}
