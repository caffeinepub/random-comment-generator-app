import { Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useMidnightCountdown } from '../hooks/useMidnightCountdown';
import { useEffect, useState } from 'react';

export default function MidnightCountdownTimer() {
  const { formattedTime, hasReset } = useMidnightCountdown();
  const [showMotivation, setShowMotivation] = useState(false);

  useEffect(() => {
    if (hasReset) {
      setShowMotivation(true);
      setTimeout(() => setShowMotivation(false), 3000);
    }
  }, [hasReset]);

  return (
    <Card className="border-2 border-blue-200/50 dark:border-blue-800/50 rounded-2xl overflow-hidden shadow-lg bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center shadow-md animate-pulse">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {showMotivation ? 'New Day Started!' : 'Time Until Midnight'}
            </div>
            <div className="text-2xl font-black bg-gradient-to-r from-blue-600 via-teal-600 to-orange-600 bg-clip-text text-transparent tabular-nums transition-all duration-300">
              {formattedTime}
            </div>
          </div>
        </div>
        {!showMotivation && (
          <div className="mt-2 text-xs font-medium text-center bg-gradient-to-r from-blue-600 via-teal-600 to-orange-600 bg-clip-text text-transparent animate-pulse">
            Make the most of today! ✨
          </div>
        )}
        {showMotivation && (
          <div className="mt-2 text-xs font-bold text-center text-green-600 dark:text-green-400 animate-bounce">
            🎉 Fresh start! Your next opportunity awaits!
          </div>
        )}
      </CardContent>
    </Card>
  );
}
