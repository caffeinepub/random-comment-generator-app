import React from 'react';
import { Clock } from 'lucide-react';
import { useMidnightCountdown } from '../hooks/useMidnightCountdown';

interface Props {
  compact?: boolean;
}

export default function MidnightCountdownTimer({ compact }: Props) {
  const { formattedTime, hasReset } = useMidnightCountdown();

  if (compact) {
    return (
      <div className="flex flex-col items-center px-3 py-1.5 rounded-xl border border-white/10 bg-background/60 backdrop-blur-sm min-w-[140px]">
        <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest leading-none mb-0.5">
          Time Until Midnight
        </span>
        <div className="flex items-center gap-1.5">
          <Clock className={`w-3.5 h-3.5 text-cyan-400 ${hasReset ? 'animate-spin' : ''}`} />
          <span className="text-base font-bold text-cyan-400 font-mono leading-none">{formattedTime}</span>
        </div>
        <span className="text-[9px] text-muted-foreground/60 mt-0.5">Make the most of today! ✨</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-4 py-2 rounded-xl border border-white/10 bg-background/60 backdrop-blur-sm">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Time Until Midnight</span>
      <div className="flex items-center gap-2 mt-1">
        <Clock className={`w-4 h-4 text-cyan-400 ${hasReset ? 'animate-spin' : ''}`} />
        <span className="text-xl font-bold text-cyan-400 font-mono">{formattedTime}</span>
      </div>
      <span className="text-xs text-muted-foreground/60 mt-0.5">Make the most of today! ✨</span>
    </div>
  );
}
