import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <h1>Consulta de Resultados del Tamizaje Neonatal</h1>
      <p>
        Este es el <em>bosquejo ejecutable</em> del portal ciudadano desacoplado.
        Demuestra cómo el portal sigue funcionando incluso si el backend clínico
        (primary de PostgreSQL) está caído, leyendo del <strong>standby</strong>.
      </p>
      <form action="/buscar" method="GET" style={{ display: 'grid', gap: '1rem', maxWidth: 420 }}>
        <label>
          <div>Cédula de la madre</div>
          <input name="cedula" required placeholder="4-769-466"
                 style={{ width: '100%', padding: '.5rem' }} />
        </label>
        <label>
          <div>Fecha de nacimiento del bebé</div>
          <input type="date" name="fecha" required style={{ width: '100%', padding: '.5rem' }} />
        </label>
        <button type="submit" style={{
          background: '#1F4E79', color: '#fff', padding: '.75rem', border: 0, borderRadius: 4
        }}>Ingresar</button>
      </form>
      <hr style={{ margin: '2rem 0' }} />
      <p style={{ fontSize: '.85rem', opacity: 0.7 }}>
        ¿Eres personal autenticado? <Link href="/api/auth/signin">Iniciar sesión SSO (Keycloak)</Link>
      </p>
    </div>
  );
}
