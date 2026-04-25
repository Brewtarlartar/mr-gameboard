'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';

const STORAGE_KEY = 'tome-intro-seen';
const DURATION_MS = 4500;
const EMBER_COUNT = 16;
const SPLASH_VOLUME = 0.85;
const FADE_START_MS = 2800;
const FADE_DURATION_MS = 700;

export default function IntroSplash() {
  // `show` starts as `null` so the splash does NOT render on the server or on
  // the very first client paint. We only flip it to `true` after we've checked
  // sessionStorage, which prevents a brief "flash + fade" on subsequent
  // navigations within the same session (where the intro should stay hidden).
  const [show, setShow] = useState<boolean | null>(null);
  // `started` flips on the user's first tap. iOS Safari (and any web context)
  // refuses audio.play() without a prior user gesture, so the splash music
  // and the synchronized visual sequence are both gated behind that tap.
  const [started, setStarted] = useState(false);
  const splashAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const force = new URLSearchParams(window.location.search).has('intro');
    let seen = false;
    try {
      seen = !force && !!sessionStorage.getItem(STORAGE_KEY);
    } catch {
      // If sessionStorage is unavailable, treat the intro as already seen
      // so we don't get stuck on a splash that can't remember being dismissed.
      seen = true;
    }
    if (seen) {
      setShow(false);
      return;
    }
    setShow(true);
  }, []);

  useEffect(() => {
    if (!started) return;
    const audio = splashAudioRef.current;
    if (audio) {
      audio.volume = SPLASH_VOLUME;
      audio.play().catch(() => {});
    }

    const readyTimer = window.setTimeout(() => {
      try {
        sessionStorage.setItem(STORAGE_KEY, '1');
      } catch {}
      try {
        window.dispatchEvent(new Event('tome-audio-start'));
      } catch {}
      setShow(false);
    }, DURATION_MS);

    let rafId = 0;
    const fadeTimer = window.setTimeout(() => {
      if (!audio) return;
      const start = performance.now();
      const startVol = audio.volume;
      const step = (now: number) => {
        const t = Math.min((now - start) / FADE_DURATION_MS, 1);
        audio.volume = startVol * (1 - t);
        if (t < 1) {
          rafId = requestAnimationFrame(step);
        } else {
          audio.pause();
        }
      };
      rafId = requestAnimationFrame(step);
    }, FADE_START_MS);

    return () => {
      window.clearTimeout(readyTimer);
      window.clearTimeout(fadeTimer);
      if (rafId) cancelAnimationFrame(rafId);
      if (audio) audio.pause();
    };
  }, [started]);

  const handleTap = () => {
    if (!started) {
      setStarted(true);
    }
  };

  return (
    <AnimatePresence>
      {show === true && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          onClick={handleTap}
          className="fixed inset-0 z-[100] bg-black overflow-hidden cursor-pointer"
        >
          <audio ref={splashAudioRef} src="/Splash%20theme.m4a" preload="auto" />
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: started ? 1.08 : 1 }}
            transition={{ duration: started ? DURATION_MS / 1000 : 0, ease: 'linear' }}
            className="absolute inset-0"
          >
            <Image
              src="/Intro.png"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </motion.div>

          {started && (
            <motion.div
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.55, 0.3, 0.65, 0.35] }}
              transition={{ duration: DURATION_MS / 1000, ease: 'easeInOut' }}
              className="pointer-events-none absolute inset-0 mix-blend-screen"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 55%, rgba(251, 191, 36, 0.45) 0%, rgba(220, 38, 38, 0.18) 35%, rgba(0,0,0,0) 70%)',
              }}
            />
          )}

          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            {Array.from({ length: EMBER_COUNT }).map((_, i) => {
              const left = (i * 37) % 100;
              const delay = (i * 0.31) % 3;
              const duration = 3 + (i % 4);
              const drift = ((i * 53) % 40) - 20;
              return (
                <span
                  key={i}
                  className="intro-ember"
                  style={{
                    left: `${left}%`,
                    animationDelay: `${delay}s`,
                    animationDuration: `${duration}s`,
                    ['--drift' as string]: `${drift}px`,
                  }}
                />
              );
            })}
          </div>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[55vh]"
            style={{
              background:
                'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.55) 30%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0) 100%)',
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="absolute bottom-[22vh] left-0 right-0 flex flex-col items-center gap-3 sm:gap-4 px-6 pointer-events-none"
          >
            <span className="intro-title">THE TOME</span>
            <div className="w-52 sm:w-64 h-[3px] bg-stone-800/70 rounded-full overflow-hidden border border-amber-900/40 shadow-[inset_0_1px_1px_rgba(0,0,0,0.6)]">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: started ? 1 : 0 }}
                transition={{ duration: started ? DURATION_MS / 1000 : 0, ease: 'linear' }}
                style={{ transformOrigin: '0% 50%' }}
                className="h-full bg-gradient-to-r from-amber-700 via-amber-300 to-amber-700 shadow-[0_0_10px_rgba(251,191,36,0.7)]"
              />
            </div>
            <span className="intro-subtitle">Board game companion</span>
          </motion.div>

          {!started && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: [0, 1, 0.6, 1], y: 0 }}
              transition={{ duration: 2, repeat: Infinity, repeatType: 'loop' }}
              className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none"
            >
              <span className="text-amber-200/90 text-[11px] sm:text-xs font-serif italic tracking-[0.2em] uppercase drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
                Tap to begin thy tale
              </span>
            </motion.div>
          )}

        </motion.div>
      )}
    </AnimatePresence>
  );
}
