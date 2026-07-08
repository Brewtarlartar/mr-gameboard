import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import Card from './Card';

export interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  className?: string;
}

/** Small labeled-number tile for dashboards (games owned, sessions, hours…). */
export default function StatCard({ label, value, icon, className }: StatCardProps) {
  return (
    <Card className={cn('p-4 flex flex-col gap-1', className)}>
      <div className="flex items-center gap-2 text-ink-muted/70">
        {icon && <span className="text-gold/80 [&>svg]:w-4 [&>svg]:h-4">{icon}</span>}
        <span className="text-[11px] font-serif uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-display font-bold text-ink leading-tight">{value}</div>
    </Card>
  );
}
