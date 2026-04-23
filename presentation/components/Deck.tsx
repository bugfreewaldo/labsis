'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export type DeckSlide = {
  id: string;
  title: string;
  notes?: string;
  render: () => ReactNode;
};

export function Deck({ slides }: { slides: DeckSlide[] }) {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [showNotes, setShowNotes] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = window.location.hash.replace('#', '');
    const n = Number(h);
    if (!Number.isNaN(n) && n >= 1 && n <= slides.length) setIdx(n - 1);
  }, [slides.length]);

  useEffect(() => {
    window.history.replaceState(null, '', `#${idx + 1}`);
  }, [idx]);

  const goto = useCallback((target: number) => {
    setIdx(prev => {
      const t = Math.max(0, Math.min(slides.length - 1, target));
      setDir(t >= prev ? 1 : -1);
      return t;
    });
  }, [slides.length]);

  const next = useCallback(() => goto(idx + 1), [goto, idx]);
  const prev = useCallback(() => goto(idx - 1), [goto, idx]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
        case 'PageDown':
          e.preventDefault(); next(); break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault(); prev(); break;
        case 'Home': goto(0); break;
        case 'End':  goto(slides.length - 1); break;
        case 'f':
        case 'F':
          if (document.fullscreenElement) document.exitFullscreen();
          else rootRef.current?.requestFullscreen?.();
          break;
        case 'n':
        case 'N':
          setShowNotes(v => !v); break;
        case '?':
          setShowHelp(v => !v); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, goto, slides.length]);

  const slide = slides[idx];
  const progressTarget = useMemo(() => ((idx + 1) / slides.length) * 100, [idx, slides.length]);
  const progressMV = useMotionValue(0);
  const progressSpring = useSpring(progressMV, { damping: 30, stiffness: 120 });
  useEffect(() => { progressMV.set(progressTarget); }, [progressTarget, progressMV]);
  const progressWidth = useTransform(progressSpring, v => `${v}%`);

  return (
    <div ref={rootRef} className="w-screen h-screen relative flex items-center justify-center overflow-hidden">
      <BackgroundAurora />

      <div
        className="relative shadow-[0_25px_80px_-20px_rgba(0,0,0,0.6)] rounded-md"
        style={{
          width: 'min(96vw, calc(96vh * 16 / 9))',
          height: 'min(54vw, 96vh)',
          aspectRatio: '16 / 9'
        }}
      >
        <div className="absolute inset-0 rounded-md overflow-hidden">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={slide.id}
              className="absolute inset-0"
              custom={dir}
              initial={(d: number) => ({ opacity: 0, x: d * 60, scale: 0.985 })}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={(d: number) => ({ opacity: 0, x: -d * 60, scale: 0.985 })}
              transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            >
              {slide.render()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 no-print">
        <motion.div className="h-1 bg-panama-green" style={{ width: progressWidth }} />
      </div>

      <TopBar
        idx={idx}
        total={slides.length}
        onPrev={prev}
        onNext={next}
        onJump={goto}
        title={slide.title}
        showNotes={showNotes}
        toggleNotes={() => setShowNotes(v => !v)}
        toggleHelp={() => setShowHelp(v => !v)}
      />

      <AnimatePresence>
        {showNotes && <NotesPanel key="notes" note={slide.notes} />}
      </AnimatePresence>
      <AnimatePresence>
        {showHelp && <HelpOverlay key="help" onClose={() => setShowHelp(false)} />}
      </AnimatePresence>
    </div>
  );
}

function BackgroundAurora() {
  return (
    <>
      <div className="absolute inset-0 bg-[#06121f]" />
      <motion.div
        aria-hidden
        className="absolute -inset-40 pointer-events-none"
        animate={{ rotate: [0, 6, -2, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background:
            'radial-gradient(60% 60% at 20% 30%, rgba(22,163,74,.16), transparent 60%), ' +
            'radial-gradient(55% 55% at 80% 70%, rgba(59,130,246,.18), transparent 60%), ' +
            'radial-gradient(50% 50% at 50% 50%, rgba(250,204,21,.06), transparent 70%)'
        }}
      />
      <motion.div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          backgroundImage:
            'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)'
        }}
      />
    </>
  );
}

function TopBar(props: {
  idx: number; total: number; onPrev: () => void; onNext: () => void;
  onJump: (n: number) => void; title: string;
  showNotes: boolean; toggleNotes: () => void; toggleHelp: () => void;
}) {
  const { idx, total, onPrev, onNext, onJump, title, showNotes, toggleNotes, toggleHelp } = props;
  return (
    <div className="absolute top-3 left-4 right-4 flex items-center justify-between text-white/80 text-xs no-print">
      <div className="flex items-center gap-3">
        <span className="font-mono bg-white/10 rounded px-2 py-0.5">{idx + 1}/{total}</span>
        <span className="opacity-60 truncate max-w-[40vw]">{title}</span>
      </div>
      <div className="flex items-center gap-2">
        <motion.button whileTap={{ scale: 0.92 }} onClick={onPrev}
          className="btn-ghost px-2 py-1 rounded hover:bg-white/10">←</motion.button>
        <select value={idx} onChange={e => onJump(Number(e.target.value))}
          className="bg-white/10 text-white text-xs px-2 py-1 rounded border border-white/20">
          {Array.from({ length: total }, (_, i) => (
            <option key={i} value={i} className="bg-[#0b1e32]">slide {i + 1}</option>
          ))}
        </select>
        <motion.button whileTap={{ scale: 0.92 }} onClick={onNext}
          className="btn-ghost px-2 py-1 rounded hover:bg-white/10">→</motion.button>
        <motion.button whileTap={{ scale: 0.92 }} onClick={toggleNotes}
          className={`btn-ghost px-2 py-1 rounded hover:bg-white/10 ${showNotes ? 'bg-white/15' : ''}`}>
          notas
        </motion.button>
        <motion.button whileTap={{ scale: 0.92 }} onClick={toggleHelp}
          className="btn-ghost px-2 py-1 rounded hover:bg-white/10">?</motion.button>
      </div>
    </div>
  );
}

function NotesPanel({ note }: { note?: string }) {
  return (
    <motion.div
      className="absolute right-4 top-14 bottom-4 w-[28vw] max-w-md bg-white/95 backdrop-blur rounded-lg shadow-2xl p-4 text-sm overflow-y-auto no-print"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ type: 'spring', damping: 24, stiffness: 220 }}
    >
      <div className="text-xs uppercase tracking-widest text-navy font-bold mb-2">Notas del presentador</div>
      {note
        ? <p className="text-slate-700 leading-relaxed whitespace-pre-line">{note}</p>
        : <p className="text-slate-400 italic">Sin notas para esta slide.</p>}
    </motion.div>
  );
}

function HelpOverlay({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      className="absolute inset-0 bg-black/70 text-white flex items-center justify-center no-print z-10"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-[#0b1e32] border border-white/20 rounded-lg p-8 max-w-lg"
        onClick={e => e.stopPropagation()}
        initial={{ scale: 0.9, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95 }}
        transition={{ type: 'spring', damping: 22, stiffness: 220 }}
      >
        <h2 className="text-2xl font-bold mb-4">Atajos de teclado</h2>
        <ul className="space-y-2 text-sm">
          <li><span className="kbd">→</span> / <span className="kbd">Espacio</span> — siguiente</li>
          <li><span className="kbd">←</span> — anterior</li>
          <li><span className="kbd">Home</span> / <span className="kbd">End</span> — primera / última</li>
          <li><span className="kbd">F</span> — pantalla completa</li>
          <li><span className="kbd">N</span> — mostrar / ocultar notas</li>
          <li><span className="kbd">?</span> — esta ayuda</li>
          <li><span className="opacity-60">URL con hash </span><code className="kbd">#5</code><span className="opacity-60"> salta a la slide 5</span></li>
        </ul>
        <button onClick={onClose} className="mt-6 px-4 py-2 bg-panama-green rounded text-white">Cerrar</button>
        <style jsx>{`
          .kbd {
            background: #233852; border: 1px solid #3a5277; border-radius: 4px;
            padding: 2px 8px; font-family: ui-monospace, monospace; font-size: 0.75rem;
          }
        `}</style>
      </motion.div>
    </motion.div>
  );
}
