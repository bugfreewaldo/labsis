import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Labsis MVP — Proyecto Final 1MW211',
  description: 'Presentación de defensa del Proyecto Final · Modernización de Labsis'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
