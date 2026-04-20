'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Library, Play, Compass, BarChart3, User, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import TomeLogo from '@/components/layout/TomeLogo';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';
import { useMobile, useHapticFeedback } from '@/lib/hooks/useMobile';

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

  // Horizontal-swipe navigation between top-level pages on mobile.
  // Swipe left → next page, swipe right → previous page. The handler is
  // attached to #main-scroll so modals rendered to document.body (via portals)
  // never trigger it, and we additionally bail out on horizontal carousels,
  // form controls, and whenever an inline AI panel is open.
  useEffect(() => {
    if (!isMobile) return;

    const el = document.getElementById('main-scroll');
    if (!el) return;

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

    if (currentIndex === -1) return;

    const THRESHOLD = 70;
    const MAX_DURATION = 600;
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let tracking = false;
    let blocked = false;

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

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        tracking = false;
        return;
      }
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      startTime = Date.now();
      tracking = true;
      blocked = shouldBlock(e.target);
    };

    const onMove = (e: TouchEvent) => {
      if (!tracking || e.touches.length !== 1) return;
      const t = e.touches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      // Once the gesture is clearly a vertical scroll, stop tracking so we
      // never interrupt a page-long scroll with a late nav change.
      if (Math.abs(dy) > 24 && Math.abs(dy) > Math.abs(dx)) {
        tracking = false;
      }
    };

    const onEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      if (blocked) return;

      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const dt = Date.now() - startTime;

      if (dt > MAX_DURATION) return;
      if (Math.abs(dx) < THRESHOLD) return;
      if (Math.abs(dy) > Math.abs(dx) * 0.6) return;

      if (dx < 0 && currentIndex < NAV_ORDER.length - 1) {
        haptic.selection();
        router.push(NAV_ORDER[currentIndex + 1]);
      } else if (dx > 0 && currentIndex > 0) {
        haptic.selection();
        router.push(NAV_ORDER[currentIndex - 1]);
      }
    };

    const onCancel = () => {
      tracking = false;
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
  }, [isMobile, pathname, router]);

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
        <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </div>

      {isMobile && <MobileBottomNav />}
    </div>
  );
}
