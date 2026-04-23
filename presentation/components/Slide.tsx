'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
  type Variants
} from 'framer-motion';

// ------------------ variants: the staged reveal ------------------
export const enterStagger: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.05 } }
};
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', damping: 22, stiffness: 140 } }
};
export const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -30 },
  show:   { opacity: 1, x: 0, transition: { type: 'spring', damping: 22, stiffness: 140 } }
};
export const fadeRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  show:   { opacity: 1, x: 0, transition: { type: 'spring', damping: 22, stiffness: 140 } }
};
export const zoomIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show:   { opacity: 1, scale: 1, transition: { type: 'spring', damping: 18, stiffness: 120 } }
};

// ------------------ Slide wrapper ------------------
type SlideProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: { left?: string; right?: string };
  /** Remove padding and title bar (full-bleed hero slides) */
  bare?: boolean;
};

export function Slide({ title, subtitle, children, footer, bare }: SlideProps) {
  if (bare) return <div className="slide">{children}</div>;
  return (
    <motion.div
      className="slide"
      initial="hidden"
      animate="show"
      variants={enterStagger}
    >
      {title && (
        <motion.div className="slide-title-bar" variants={fadeUp}>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm italic text-navy-100 mt-1">{subtitle}</p>}
        </motion.div>
      )}
      <motion.div className="slide-body" variants={enterStagger}>
        {children}
      </motion.div>
      <motion.div className="slide-footer" variants={fadeUp}>
        <span>{footer?.left ?? 'Proyecto Final · Tópicos Avanzados II · 1MW211'}</span>
        <span>{footer?.right ?? 'UTP · 2026'}</span>
      </motion.div>
    </motion.div>
  );
}

// ------------------ Bullets with stagger ------------------
export function Bullets({ items, size = 'md' }: {
  items: (string | { label: string; body: string })[];
  size?: 'sm' | 'md' | 'lg';
}) {
  const sz = size === 'lg' ? 'text-xl' : size === 'sm' ? 'text-sm' : 'text-lg';
  return (
    <motion.ul className={`space-y-3 ${sz} text-slate-800`} variants={enterStagger}>
      {items.map((it, i) => (
        <motion.li key={i} className="flex gap-3" variants={fadeUp}>
          <motion.span
            className="text-panama-green font-bold inline-block"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.08 * i, type: 'spring', stiffness: 260, damping: 18 }}
          >
            ▸
          </motion.span>
          <span>
            {typeof it === 'string' ? it : (
              <>
                <span className="bullet-label">{it.label}: </span>
                <span>{it.body}</span>
              </>
            )}
          </span>
        </motion.li>
      ))}
    </motion.ul>
  );
}

// ------------------ Figure with zoom on enter + gentle hover ------------------
export function Figure({ src, alt, caption, maxW = '85%' }: {
  src: string; alt: string; caption?: string; maxW?: string;
}) {
  return (
    <motion.figure
      className="w-full h-full flex flex-col items-center justify-center"
      variants={enterStagger}
    >
      <motion.img
        src={src}
        alt={alt}
        style={{ maxWidth: maxW, maxHeight: '82%' }}
        className="object-contain rounded-sm shadow-lg"
        variants={zoomIn}
        whileHover={{ scale: 1.025 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      />
      {caption && (
        <motion.figcaption className="mt-3 text-xs italic text-slate-500" variants={fadeUp}>
          {caption}
        </motion.figcaption>
      )}
    </motion.figure>
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
    <motion.div className={`grid ${map[ratio]} gap-8 h-full`} variants={enterStagger}>
      <motion.div variants={fadeLeft}>{left}</motion.div>
      <motion.div variants={fadeRight}>{right}</motion.div>
    </motion.div>
  );
}

// ------------------ Stat with number count-up ------------------
export function Stat({ value, label, color = 'navy', delay = 0 }: {
  value: string; label: string; color?: 'navy' | 'green' | 'yellow' | 'red'; delay?: number;
}) {
  const colors: Record<string, string> = {
    navy:   'from-navy to-navy-700 text-white',
    green:  'from-panama-green to-emerald-700 text-white',
    yellow: 'from-panama-yellow to-amber-400 text-slate-900',
    red:    'from-red-600 to-red-800 text-white'
  };
  return (
    <motion.div
      className={`rounded-xl p-6 bg-gradient-to-br ${colors[color]} shadow-xl overflow-hidden relative`}
      variants={zoomIn}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      <motion.div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        style={{
          background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,.4), transparent 60%)'
        }}
      />
      <div className="relative">
        <AnimatedValue value={value} delay={delay} />
        <div className="text-sm mt-2 opacity-95">{label}</div>
      </div>
    </motion.div>
  );
}

function AnimatedValue({ value, delay = 0 }: { value: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  // Try to parse a number out of the value string to animate count-up.
  const match = /([+\-]?\d+(?:[.,]\d+)?)/.exec(value);
  const num = match ? parseFloat(match[1].replace(',', '.')) : null;

  const mv = useMotionValue(0);
  const spring = useSpring(mv, { damping: 30, stiffness: 90 });
  const display = useTransform(spring, (v: number) => {
    if (num == null) return value;
    const formatted = Number.isInteger(num) ? Math.round(v).toString() : v.toFixed(1);
    return value.replace(match![0], formatted);
  });

  useEffect(() => {
    if (inView && num != null) {
      const t = setTimeout(() => mv.set(num), delay * 1000);
      return () => clearTimeout(t);
    }
  }, [inView, num, mv, delay]);

  return (
    <motion.div ref={ref} className="text-5xl font-extrabold leading-none tabular-nums">
      {num == null ? value : <motion.span>{display}</motion.span>}
    </motion.div>
  );
}

// ------------------ Typewriter (for the demo terminal line) ------------------
export function Typewriter({ text, speed = 40, delay = 0, className = '', caret = true }: {
  text: string; speed?: number; delay?: number; className?: string; caret?: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  useEffect(() => {
    if (!inView) return;
    const start = setTimeout(() => {
      const iv = setInterval(() => {
        setIdx(i => {
          if (i >= text.length) { clearInterval(iv); return i; }
          return i + 1;
        });
      }, speed);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(start);
  }, [inView, text.length, speed, delay]);
  return (
    <span ref={ref} className={className}>
      {text.slice(0, idx)}
      {caret && idx < text.length && <span className="inline-block w-[0.4em] h-[1em] align-middle bg-green-300 ml-0.5 animate-pulse" />}
    </span>
  );
}

// ------------------ Animated "breathing" ambient background for hero slides ------------------
export function AmbientBG({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        aria-hidden
        className="absolute -inset-40"
        initial={{ opacity: 0.4 }}
        animate={{
          opacity: [0.3, 0.55, 0.3],
          rotate: [0, 6, 0]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background:
            'radial-gradient(60% 60% at 30% 30%, rgba(22,163,74,.18), transparent 60%), ' +
            'radial-gradient(55% 55% at 75% 70%, rgba(59,130,246,.18), transparent 60%)'
        }}
      />
      <motion.div
        aria-hidden
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{
          backgroundImage:
            'linear-gradient(180deg, rgba(255,255,255,0.02), transparent 40%), ' +
            'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.25) 100%)'
        }}
      />
      {children}
    </div>
  );
}

// ------------------ Simple "reveal when in view" wrapper (for rows) ------------------
export function Reveal({ children, delay = 0, direction = 'up' }: {
  children: ReactNode; delay?: number; direction?: 'up' | 'left' | 'right';
}) {
  const map: Record<string, Variants> = { up: fadeUp, left: fadeLeft, right: fadeRight };
  return (
    <motion.div
      variants={map[direction]}
      initial="hidden"
      animate="show"
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}
