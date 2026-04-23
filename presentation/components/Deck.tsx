'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export type DeckSlide = {
  id: string;
  title: string;
  notes?: string;
  render: () => ReactNode;
};

export function Deck({ slides }: { slides: DeckSlide[] }) {
  const [idx, setIdx] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Read initial slide from URL hash (#3 => slide 3, 1-indexed)
  useEffect(() => {
    const h = window.location.hash.replace('#', '');
    const n = Number(h);
    if (!Number.isNaN(n) && n >= 1 && n <= slides.length) setIdx(n - 1);
  }, [slides.length]);

  // Keep hash in sync so "open in new tab" lands on the same slide
  useEffect(() => {
    window.history.replaceState(null, '', `#${idx + 1}`);
  }, [idx]);

  const next = useCallback(() => setIdx(i => Math.min(i + 1, slides.length - 1)), [slides.length]);
  const prev = useCallback(() => setIdx(i => Math.max(i - 1, 0)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // don't intercept when a form field is focused
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
        case 'Home': setIdx(0); break;
        case 'End':  setIdx(slides.length - 1); break;
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
  }, [next, prev, slides.length]);

  const slide = slides[idx];
  const progress = useMemo(() => ((idx + 1) / slides.length) * 100, [idx, slides.length]);

  return (
    <div ref={rootRef} className="w-screen h-screen relative bg-[#0b1e32] flex items-center justify-center">
      {/* slide surface: 16:9, centered, letterboxed */}
      <div
        className="relative shadow-2xl"
        style={{
          width: 'min(96vw, calc(96vh * 16 / 9))',
          height: 'min(54vw, 96vh)',
          aspectRatio: '16 / 9'
        }}
      >
        <div className="absolute inset-0 rounded-md overflow-hidden">
          {slide.render()}
        </div>
      </div>

      {/* chrome */}
      <TopBar idx={idx} total={slides.length} onPrev={prev} onNext={next}
              onJump={setIdx} title={slide.title} progress={progress}
              showNotes={showNotes} toggleNotes={() => setShowNotes(v => !v)}
              toggleHelp={() => setShowHelp(v => !v)} />

      {showNotes && <NotesPanel note={slide.notes} />}
      {showHelp && <HelpOverlay onClose={() => setShowHelp(false)} />}
    </div>
  );
}

function TopBar({ idx, total, onPrev, onNext, onJump, title, progress, showNotes, toggleNotes, toggleHelp }: {
  idx: number; total: number; onPrev: () => void; onNext: () => void;
  onJump: (n: number) => void; title: string; progress: number;
  showNotes: boolean; toggleNotes: () => void; toggleHelp: () => void;
}) {
  return (
    <>
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 no-print">
        <div className="h-1 bg-panama-green transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="absolute top-3 left-4 right-4 flex items-center justify-between text-white/80 text-xs no-print">
        <div className="flex items-center gap-3">
          <span className="font-mono">{idx + 1}/{total}</span>
          <span className="opacity-60 truncate max-w-[40vw]">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onPrev} className="btn-ghost px-2 py-1 rounded hover:bg-white/10">←</button>
          <select value={idx} onChange={e => onJump(Number(e.target.value))}
                  className="bg-white/10 text-white text-xs px-2 py-1 rounded border border-white/20">
            {Array.from({ length: total }, (_, i) => (
              <option key={i} value={i} className="bg-[#0b1e32]">slide {i + 1}</option>
            ))}
          </select>
          <button onClick={onNext} className="btn-ghost px-2 py-1 rounded hover:bg-white/10">→</button>
          <button onClick={toggleNotes}
                  className={`btn-ghost px-2 py-1 rounded hover:bg-white/10 ${showNotes ? 'bg-white/15' : ''}`}>
            notas
          </button>
          <button onClick={toggleHelp} className="btn-ghost px-2 py-1 rounded hover:bg-white/10">?</button>
        </div>
      </div>
    </>
  );
}

function NotesPanel({ note }: { note?: string }) {
  return (
    <div className="absolute right-4 top-14 bottom-4 w-[28vw] max-w-md bg-white/95 rounded-lg shadow-xl p-4 text-sm overflow-y-auto no-print">
      <div className="text-xs uppercase tracking-widest text-navy font-bold mb-2">Notas del presentador</div>
      {note ? (
        <p className="text-slate-700 leading-relaxed whitespace-pre-line">{note}</p>
      ) : (
        <p className="text-slate-400 italic">Sin notas para esta slide.</p>
      )}
    </div>
  );
}

function HelpOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 bg-black/70 text-white flex items-center justify-center no-print" onClick={onClose}>
      <div className="bg-[#0b1e32] border border-white/20 rounded-lg p-8 max-w-lg" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4">Atajos de teclado</h2>
        <ul className="space-y-2 text-sm">
          <li><kbd className="kbd">→</kbd> / <kbd className="kbd">Espacio</kbd> — siguiente</li>
          <li><kbd className="kbd">←</kbd> — anterior</li>
          <li><kbd className="kbd">Home</kbd> / <kbd className="kbd">End</kbd> — primera / última</li>
          <li><kbd className="kbd">F</kbd> — pantalla completa</li>
          <li><kbd className="kbd">N</kbd> — mostrar / ocultar notas</li>
          <li><kbd className="kbd">?</kbd> — esta ayuda</li>
          <li><span className="opacity-60">URL con hash </span><code>#5</code><span className="opacity-60"> salta a la slide 5</span></li>
        </ul>
        <button onClick={onClose} className="mt-6 px-4 py-2 bg-panama-green rounded text-white">Cerrar</button>
        <style jsx>{`
          .kbd {
            background: #233852; border: 1px solid #3a5277; border-radius: 4px;
            padding: 2px 8px; font-family: ui-monospace, monospace; font-size: 0.75rem;
          }
        `}</style>
      </div>
    </div>
  );
}
