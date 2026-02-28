import { useState, useEffect } from 'react';

export function useMidnightCountdown() {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [hasReset, setHasReset] = useState(false);

  useEffect(() => {
    const calculateTimeUntilMidnight = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      return midnight.getTime() - now.getTime();
    };

    const updateCountdown = () => {
      const remaining = calculateTimeUntilMidnight();
      
      // Detect midnight reset
      if (remaining > 86400000 - 1000 && timeRemaining < 1000 && timeRemaining > 0) {
        setHasReset(true);
        setTimeout(() => setHasReset(false), 3000);
      }
      
      setTimeRemaining(remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  const formatCountdown = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return {
    timeRemaining,
    formattedTime: formatCountdown(timeRemaining),
    hasReset,
  };
}
