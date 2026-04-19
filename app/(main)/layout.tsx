'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Library, Play, Compass, BarChart3, User, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import TomeLogo from '@/components/layout/TomeLogo';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';
import { useMobile } from '@/lib/hooks/useMobile';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isMobile = useMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/library', label: 'Library', icon: Library },
    { href: '/discover', label: 'Discover', icon: Compass },
    { href: '/play', label: 'Play', icon: Play },
    { href: '/analytics', label: 'Stats', icon: BarChart3 },
    { href: '/me', label: 'Me', icon: User },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-stone-900/75 backdrop-blur-lg border-b border-amber-900/40 shadow-lg">
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
          isMobile ? 'top-14 pb-24' : 'top-14'
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
