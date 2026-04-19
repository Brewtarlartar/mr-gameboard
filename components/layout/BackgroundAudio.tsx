'use client';

import { useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useAudioStore } from '@/lib/store/audioStore';

const BACKGROUND_VOLUME = 0.18;

export default function BackgroundAudio() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { isMuted, toggleMuted } = useAudioStore();
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = BACKGROUND_VOLUME;

    if (isMuted) {
      audio.pause();
      return;
    }

    const attemptPlay = () => {
      if (!isMutedRef.current && audio.paused) {
        audio.play().catch(() => {});
      }
    };

    const handlePause = () => {
      if (!isMutedRef.current && !document.hidden) {
        audio.play().catch(() => {});
      }
    };

    const handleVisibility = () => {
      if (!document.hidden && !isMutedRef.current && audio.paused) {
        audio.play().catch(() => {});
      }
    };

    // Skip the immediate play attempt while the intro splash is still showing
    // (its own theme is playing). The tap-to-enter dispatches `tome-audio-start`
    // which will kick this off at the right moment.
    let introSeen = true;
    try {
      introSeen = sessionStorage.getItem('tome-intro-seen') === '1';
    } catch {}
    if (introSeen) {
      audio.play().catch(() => {});
    }

    document.addEventListener('pointerdown', attemptPlay);
    document.addEventListener('click', attemptPlay);
    document.addEventListener('touchstart', attemptPlay);
    document.addEventListener('keydown', attemptPlay);
    window.addEventListener('tome-audio-start', attemptPlay);
    audio.addEventListener('pause', handlePause);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('pointerdown', attemptPlay);
      document.removeEventListener('click', attemptPlay);
      document.removeEventListener('touchstart', attemptPlay);
      document.removeEventListener('keydown', attemptPlay);
      window.removeEventListener('tome-audio-start', attemptPlay);
      audio.removeEventListener('pause', handlePause);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isMuted]);

  return (
    <>
      <audio ref={audioRef} src="/The_Wizards_Hearth.m4a" loop preload="auto" />
      <button
        onClick={toggleMuted}
        aria-label={isMuted ? 'Unmute background music' : 'Mute background music'}
        className="fixed z-50 bottom-24 right-4 lg:bottom-6 lg:right-6 p-3 rounded-full bg-stone-900/85 border border-amber-900/60 text-amber-200 hover:text-amber-100 hover:border-amber-500/70 hover:shadow-[0_0_12px_-2px_rgba(251,191,36,0.5)] backdrop-blur-sm transition-all"
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>
    </>
  );
}
