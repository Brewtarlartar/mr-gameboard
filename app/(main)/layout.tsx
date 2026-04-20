'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Library, Play, Compass, BarChart3, User, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import TomeLogo from '@/components/layout/TomeLogo';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';
import { useMobile, useHapticFeedback } from '@/lib/hooks/useMobile';

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useMobile();
  const haptic = useHapticFeedback();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/library', label: 'Library', icon: Library },
    { href: '/discover', label: 'Catalog', icon: Compass },
    { href: '/play', label: 'Play', icon: Play },
    { href: '/analytics', label: 'Stats', icon: BarChart3 },
    { href: '/me', label: 'Me', icon: User },
  ];

  // Fluid horizontal-swipe navigation between top-level pages on mobile.
  // The wrapper around {children} tracks the finger in real time via a
  // motion value; on release we either animate the page off-screen and
  // navigate, or spring back to rest. The incoming page then slides in
  // from the opposite edge, giving a true "carousel" feel instead of a
  // swipe-then-jump.
  const swipeX = useMotionValue(0);
  const pendingDirRef = useRef<1 | -1 | 0>(0);
  const prevPathnameRef = useRef(pathname);

  const NAV_ORDER = navItems.map((n) => n.href);
  const currentIndex = (() => {
    let best = -1;
    let bestLen = -1;
    NAV_ORDER.forEach((href, i) => {
      const matches =
        href === '/'
          ? pathname === '/'
          : pathname === href || pathname?.startsWith(href + '/');
      if (matches && href.length > bestLen) {
        best = i;
        bestLen = href.length;
      }
    });
    return best;
  })();

  // When the route changes as a result of a swipe, slide the new content
  // in from the opposite edge. If the nav came from a tap / back-forward
  // we skip the entrance animation so nothing jumps unexpectedly. Using
  // useLayoutEffect guarantees the offset is applied before the browser
  // paints the new page, so we never see a frame of it at the old (off-
  // screen) translate.
  useIsomorphicLayoutEffect(() => {
    if (prevPathnameRef.current === pathname) return;
    prevPathnameRef.current = pathname;

    const dir = pendingDirRef.current;
    pendingDirRef.current = 0;
    if (dir === 0) {
      swipeX.set(0);
      return;
    }

    const w = typeof window !== 'undefined' ? window.innerWidth : 400;
    swipeX.set(dir === 1 ? w : -w);
    animate(swipeX, 0, {
      type: 'tween',
      duration: 0.24,
      ease: [0.22, 1, 0.36, 1],
    });
  }, [pathname, swipeX]);

  // Prefetch adjacent top-level routes so the page that slides in is
  // already compiled/cached — that's what makes the hand-off feel instant.
  useEffect(() => {
    if (!isMobile) return;
    NAV_ORDER.forEach((href) => {
      try {
        router.prefetch(href);
      } catch {}
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, pathname]);

  useEffect(() => {
    if (!isMobile) return;
    if (currentIndex === -1) return;

    const el = document.getElementById('main-scroll');
    if (!el) return;

    const HORIZONTAL_COMMIT = 12;
    const VERTICAL_BAIL = 18;

    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let lastX = 0;
    let lastT = 0;
    let velocity = 0; // px/ms, positive = rightward
    let tracking = false;
    let blocked = false;
    let horizontal = false;
    let navigating = false;

    const shouldBlock = (target: EventTarget | null): boolean => {
      if (!(target instanceof Element)) return false;
      if (document.body.classList.contains('ai-panel-open')) return true;
      if (target.closest('[data-no-swipe="true"]')) return true;
      if (target.closest('input, textarea, select, [contenteditable="true"]')) return true;
      if (target.closest('[role="dialog"], [aria-modal="true"]')) return true;

      let node: Element | null = target;
      while (node && node !== el) {
        const style = window.getComputedStyle(node);
        const ox = style.overflowX;
        if ((ox === 'auto' || ox === 'scroll') && node.scrollWidth - node.clientWidth > 1) {
          return true;
        }
        node = node.parentElement;
      }
      return false;
    };

    const springBack = () => {
      animate(swipeX, 0, {
        type: 'spring',
        stiffness: 420,
        damping: 42,
        mass: 0.9,
      });
    };

    const commitNavigation = (direction: 1 | -1, offset: number) => {
      const targetIndex = currentIndex + direction;
      if (targetIndex < 0 || targetIndex >= NAV_ORDER.length) {
        springBack();
        return;
      }

      navigating = true;
      pendingDirRef.current = direction;
      haptic.selection();

      const w = window.innerWidth;
      const remaining = direction === 1 ? -w - offset : w - offset;
      const exitDuration = Math.min(
        0.22,
        Math.max(0.1, Math.abs(remaining) / Math.max(Math.abs(velocity) * 1000, 600)),
      );

      animate(swipeX, direction === 1 ? -w : w, {
        type: 'tween',
        duration: exitDuration,
        ease: [0.32, 0, 0.67, 0],
      });

      // Kick off the route transition slightly before the exit completes so
      // the new page is ready to slide in on the other side.
      window.setTimeout(() => {
        router.push(NAV_ORDER[targetIndex]);
      }, Math.max(0, exitDuration * 1000 - 60));
    };

    const onStart = (e: TouchEvent) => {
      if (navigating) return;
      if (e.touches.length !== 1) {
        tracking = false;
        return;
      }
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      lastX = startX;
      lastT = Date.now();
      startTime = lastT;
      velocity = 0;
      tracking = true;
      horizontal = false;
      blocked = shouldBlock(e.target);
    };

    const onMove = (e: TouchEvent) => {
      if (!tracking || e.touches.length !== 1) return;
      const t = e.touches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;

      if (!horizontal) {
        if (Math.abs(dy) > VERTICAL_BAIL && Math.abs(dy) > Math.abs(dx)) {
          tracking = false;
          return;
        }
        if (Math.abs(dx) > HORIZONTAL_COMMIT && Math.abs(dx) > Math.abs(dy)) {
          horizontal = true;
        }
      }

      if (horizontal && !blocked) {
        const now = Date.now();
        const dt = Math.max(now - lastT, 1);
        velocity = (t.clientX - lastX) / dt;
        lastX = t.clientX;
        lastT = now;

        // Edge resistance: swiping past the first/last page feels rubbery.
        let offset = dx;
        if (dx < 0 && currentIndex === NAV_ORDER.length - 1) offset = dx / 3;
        else if (dx > 0 && currentIndex === 0) offset = dx / 3;

        swipeX.set(offset);
      }
    };

    const onEnd = (e: TouchEvent) => {
      if (!tracking) {
        return;
      }
      tracking = false;
      if (blocked || !horizontal) {
        return;
      }

      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dt = Math.max(Date.now() - startTime, 1);
      const avgVelocity = dx / dt; // px/ms over whole gesture
      const w = window.innerWidth;

      const distanceThreshold = w * 0.22;
      const velocityThreshold = 0.45; // px/ms ~ flick
      const isNext = dx < 0 && (Math.abs(dx) > distanceThreshold || avgVelocity < -velocityThreshold);
      const isPrev = dx > 0 && (dx > distanceThreshold || avgVelocity > velocityThreshold);

      if (isNext && currentIndex < NAV_ORDER.length - 1) {
        commitNavigation(1, dx);
      } else if (isPrev && currentIndex > 0) {
        commitNavigation(-1, dx);
      } else {
        springBack();
      }
    };

    const onCancel = () => {
      const wasHorizontal = horizontal;
      tracking = false;
      horizontal = false;
      if (wasHorizontal && !navigating) {
        springBack();
      }
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: true });
    el.addEventListener('touchend', onEnd, { passive: true });
    el.addEventListener('touchcancel', onCancel, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onCancel);
    };
    // navItems is a stable literal; hooks deps lint is satisfied by the primitives we actually read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, pathname, router, currentIndex]);

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-stone-900/75 backdrop-blur-lg border-b border-amber-900/40 shadow-lg safe-area-pt">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2">
              <TomeLogo size="md" showText={true} animated={true} asLink={false} />
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium',
                      isActive
                        ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                        : 'text-stone-300 hover:text-amber-100 hover:bg-stone-800/60'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-stone-300 hover:text-amber-100 hover:bg-stone-800/60 transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-amber-900/40 bg-stone-900/95 backdrop-blur-lg"
            >
              <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                        isActive
                          ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                          : 'text-stone-300 hover:text-amber-100 hover:bg-stone-800/60'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <div
        id="main-scroll"
        className={cn(
          'fixed left-0 right-0 bottom-0 z-10 overflow-x-hidden overflow-y-auto overscroll-y-contain tome-page-scroll',
          isMobile ? 'top-0 pb-24 safe-area-pt' : 'top-14'
        )}
      >
        <motion.div
          style={isMobile ? { x: swipeX } : undefined}
          className="will-change-transform"
        >
          <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
        </motion.div>
      </div>

      {isMobile && <MobileBottomNav />}
    </div>
  );
}
