import { useEffect, useRef, useState } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

export function useInfiniteScroll({
  threshold = 500,
  onLoadMore,
  hasMore,
  isLoading,
}: UseInfiniteScrollOptions) {
  const [isFetching, setIsFetching] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (isLoading || !hasMore || isFetching) return;

      const scrollPosition = window.innerHeight + window.scrollY;
      const documentHeight = document.documentElement.scrollHeight;

      if (documentHeight - scrollPosition <= threshold) {
        setIsFetching(true);
        onLoadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold, onLoadMore, hasMore, isLoading, isFetching]);

  useEffect(() => {
    if (!isLoading) {
      setIsFetching(false);
    }
  }, [isLoading]);

  return { sentinelRef, isFetching };
}
