import { Suspense, ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyLoadWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function LazyLoadWrapper({ children, fallback }: LazyLoadWrapperProps) {
  const defaultFallback = (
    <div className="min-h-screen flex items-center justify-center animate-fade-in">
      <div className="space-y-4 w-full max-w-2xl p-6">
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    </div>
  );

  return <Suspense fallback={fallback || defaultFallback}>{children}</Suspense>;
}
