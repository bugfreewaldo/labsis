import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Labsis MVP — Portal Ciudadano',
  description: 'Portal de consulta de resultados del Tamizaje Neonatal (MVP-mock)'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body style={{
        fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
        margin: 0,
        background: '#f5f7fa',
        color: '#1f2937'
      }}>
        <header style={{
          background: '#1F4E79',
          color: '#fff',
          padding: '1rem 2rem'
        }}>
          <strong>Labsis MVP · Portal Ciudadano (mock)</strong>
          <span style={{ float: 'right', fontSize: '0.85rem', opacity: 0.8 }}>
            Tamizaje Neonatal · HJRE · Panamá
          </span>
        </header>
        <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>{children}</main>
      </body>
    </html>
  );
}
