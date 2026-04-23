import type { ReactNode } from 'react';

type SlideProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: { left?: string; right?: string };
  /** Remove padding and title bar, for full-bleed slides */
  bare?: boolean;
};

export function Slide({ title, subtitle, children, footer, bare }: SlideProps) {
  if (bare) {
    return (
      <div className="slide">
        {children}
      </div>
    );
  }
  return (
    <div className="slide">
      {title && (
        <div className="slide-title-bar">
          <h1 className="text-3xl font-bold">{title}</h1>
          {subtitle && <p className="text-sm italic text-navy-100 mt-1">{subtitle}</p>}
        </div>
      )}
      <div className="slide-body">{children}</div>
      <div className="slide-footer">
        <span>{footer?.left ?? 'Proyecto Final · Tópicos Avanzados II · 1MW211'}</span>
        <span>{footer?.right ?? 'UTP · 2026'}</span>
      </div>
    </div>
  );
}

export function Bullets({ items, size = 'md' }: {
  items: (string | { label: string; body: string })[];
  size?: 'sm' | 'md' | 'lg';
}) {
  const sz = size === 'lg' ? 'text-xl' : size === 'sm' ? 'text-sm' : 'text-lg';
  return (
    <ul className={`space-y-3 ${sz} text-slate-800`}>
      {items.map((it, i) => (
        <li key={i} className="flex gap-3">
          <span className="text-navy font-bold">•</span>
          <span>
            {typeof it === 'string' ? it : (
              <>
                <span className="bullet-label">{it.label}: </span>
                <span>{it.body}</span>
              </>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Figure({ src, alt, caption, maxW = '85%' }: {
  src: string; alt: string; caption?: string; maxW?: string;
}) {
  return (
    <figure className="w-full h-full flex flex-col items-center justify-center">
      <img src={src} alt={alt} style={{ maxWidth: maxW, maxHeight: '82%' }} className="object-contain" />
      {caption && <figcaption className="mt-3 text-xs italic text-slate-500">{caption}</figcaption>}
    </figure>
  );
}

export function TwoCol({ left, right, ratio = '1:1' }: {
  left: ReactNode; right: ReactNode; ratio?: '1:1' | '2:1' | '3:2';
}) {
  const map: Record<string, string> = {
    '1:1': 'grid-cols-2',
    '2:1': 'grid-cols-[2fr,1fr]',
    '3:2': 'grid-cols-[3fr,2fr]'
  };
  return (
    <div className={`grid ${map[ratio]} gap-8 h-full`}>
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
}

export function Stat({ value, label, color = 'navy' }: {
  value: string; label: string; color?: 'navy' | 'green' | 'yellow' | 'red';
}) {
  const colors: Record<string, string> = {
    navy:   'bg-navy text-white',
    green:  'bg-panama-green text-white',
    yellow: 'bg-panama-yellow text-slate-900',
    red:    'bg-red-600 text-white'
  };
  return (
    <div className={`rounded-xl p-6 ${colors[color]} shadow`}>
      <div className="text-5xl font-extrabold leading-none">{value}</div>
      <div className="text-sm mt-2 opacity-90">{label}</div>
    </div>
  );
}
