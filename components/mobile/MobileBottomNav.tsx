'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, Library, Play, Compass, BarChart3, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMobileDetection, useHapticFeedback } from '@/lib/hooks/useMobile';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile } = useMobileDetection();
  const haptic = useHapticFeedback();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/library', label: 'Library', icon: Library },
    { href: '/discover', label: 'Discover', icon: Compass },
    { href: '/play', label: 'Play', icon: Play },
    { href: '/analytics', label: 'Stats', icon: BarChart3 },
    { href: '/me', label: 'Me', icon: User },
  ];

  const handleNavClick = (href: string) => {
    haptic.selection();
    router.push(href);
  };

  if (!isMobile) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-stone-900/95 backdrop-blur-lg border-t border-stone-700/40 safe-area-pb">
      <div className="flex items-center justify-around px-1 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));

          return (
            <button
              key={item.href}
              onClick={() => handleNavClick(item.href)}
              className="relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all active:scale-95 min-w-[56px] min-h-[52px]"
              aria-label={item.label}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute inset-0 bg-amber-500/20 border border-amber-500/40 rounded-xl"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon
                className={`w-6 h-6 relative z-10 transition-colors ${
                  isActive ? 'text-amber-200' : 'text-stone-400'
                }`}
              />
              <span
                className={`text-[10px] font-medium relative z-10 transition-colors ${
                  isActive ? 'text-amber-200' : 'text-stone-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
