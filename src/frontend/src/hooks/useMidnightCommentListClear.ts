import { useEffect } from 'react';
import { useClearAllCommentLists } from './useQueries';
import { useQueryClient } from '@tanstack/react-query';

const LAST_CLEAR_DATE_KEY = 'lastMidnightClearDate';

export function useMidnightCommentListClear(isEnabled: boolean) {
  const { mutate: clearAllLists } = useClearAllCommentLists();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isEnabled) return;

    const checkAndClearAtMidnight = () => {
      const now = new Date();
      const today = now.toDateString();
      
      try {
        const lastClearDate = localStorage.getItem(LAST_CLEAR_DATE_KEY);
        
        // If we haven't cleared today yet
        if (lastClearDate !== today) {
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          
          // Check if it's past midnight (00:00 - 00:59)
          if (currentHour === 0) {
            clearAllLists(undefined, {
              onSuccess: () => {
                localStorage.setItem(LAST_CLEAR_DATE_KEY, today);
                queryClient.invalidateQueries({ queryKey: ['commentListIds'] });
                queryClient.invalidateQueries({ queryKey: ['commentList'] });
                queryClient.invalidateQueries({ queryKey: ['bulkCommentTotals'] });
                console.log('Midnight comment list clear completed');
              },
              onError: (error) => {
                console.error('Midnight clear failed:', error);
              },
            });
          }
        }
      } catch (error) {
        console.error('Error accessing localStorage for midnight clear:', error);
      }
    };

    // Check immediately on mount
    checkAndClearAtMidnight();

    // Then check every minute
    const intervalId = setInterval(checkAndClearAtMidnight, 60000);

    return () => clearInterval(intervalId);
  }, [isEnabled, clearAllLists, queryClient]);
}
