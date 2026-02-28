import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const LAST_CLEAR_DATE_KEY = 'lastMidnightClearDate';

export function useMidnightCommentListClear(isEnabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isEnabled) return;

    const checkAndClearAtMidnight = () => {
      const now = new Date();
      const today = now.toDateString();

      try {
        const lastClearDate = localStorage.getItem(LAST_CLEAR_DATE_KEY);

        if (lastClearDate !== today) {
          const currentHour = now.getHours();

          if (currentHour === 0) {
            // Clear local comment lists at midnight
            localStorage.removeItem('commentLists');
            localStorage.removeItem('deviceCommentHistory');
            localStorage.setItem(LAST_CLEAR_DATE_KEY, today);
            queryClient.invalidateQueries({ queryKey: ['commentLists'] });
          }
        }
      } catch (error) {
        // Silently handle localStorage errors
      }
    };

    checkAndClearAtMidnight();
    const intervalId = setInterval(checkAndClearAtMidnight, 60000);
    return () => clearInterval(intervalId);
  }, [isEnabled, queryClient]);
}
