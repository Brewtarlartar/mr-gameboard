'use client';

import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Stack of open dialogs so Escape and the Tab trap only act on the topmost
// one when dialogs nest (e.g. a confirm inside a detail modal).
const dialogStack: symbol[] = [];

interface DialogA11yOptions {
  isOpen: boolean;
  /** Called when the user presses Escape. Usually the modal's onClose. */
  onClose: () => void;
}

/**
 * Bundles every behavior an accessible modal needs: move focus into the
 * dialog on open, trap Tab within it, close on Escape, restore focus to the
 * trigger on close, and lock body scroll (with scrollbar-width compensation).
 *
 * The caller owns the markup: point `ref` at the dialog panel and put
 * role="dialog" aria-modal="true" aria-labelledby="…" on that element.
 * Mark a specific element with `data-autofocus` to receive initial focus.
 */
export function useDialogA11y(
  ref: RefObject<HTMLElement | null>,
  { isOpen, onClose }: DialogA11yOptions,
) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const id = Symbol('dialog');
    dialogStack.push(id);
    const isTop = () => dialogStack[dialogStack.length - 1] === id;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Focus after the open render so the panel exists (AnimatePresence
    // mounts it synchronously; we just need to run after this commit).
    const focusFrame = requestAnimationFrame(() => {
      const panel = ref.current;
      if (!panel || panel.contains(document.activeElement)) return;
      const target =
        panel.querySelector<HTMLElement>('[data-autofocus]') ??
        panel.querySelector<HTMLElement>(FOCUSABLE) ??
        panel;
      if (target === panel) panel.tabIndex = -1;
      target.focus({ preventScroll: true });
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (!isTop()) return;

      if (e.key === 'Escape') {
        // Stop legacy per-modal Escape listeners from double-firing.
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (e.key !== 'Tab') return;
      const panel = ref.current;
      if (!panel) return;
      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || !panel.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !panel.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };

    // Only the first (bottom) dialog owns the body scroll lock; nested
    // dialogs leave it in place and its cleanup restores the original.
    const ownsScrollLock = dialogStack.length === 1;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    if (ownsScrollLock) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', onKeyDown, true);
      const i = dialogStack.indexOf(id);
      if (i !== -1) dialogStack.splice(i, 1);
      if (ownsScrollLock) {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      }
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [isOpen, ref]);
}
