import React, { Suspense, lazy, useEffect, useCallback } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import Header from './components/Header';
import Footer from './components/Footer';
import AnimatedBackground from './components/AnimatedBackground';
import AdminPinDialog from './components/AdminPinDialog';
import BackgroundMusicPlayer from './components/BackgroundMusicPlayer';
import { useActor } from './hooks/useActor';

const UserView = lazy(() => import('./pages/UserView'));
const UploadSection = lazy(() => import('./pages/UploadSection'));
const LiveListChecker = lazy(() => import('./pages/LiveListChecker'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

type View = 'user' | 'upload' | 'live' | 'admin';

function AppContent() {
  const [currentView, setCurrentView] = React.useState<View>('user');
  const [isAdminUnlocked, setIsAdminUnlocked] = React.useState(false);
  const [showPinDialog, setShowPinDialog] = React.useState(false);
  const { actor } = useActor();
  const qc = useQueryClient();

  // Prefetch all critical data on mount
  useEffect(() => {
    if (!actor) return;
    qc.prefetchQuery({
      queryKey: ['liveRatingListEntries'],
      queryFn: () => actor.getLiveRatingListEntries(),
      staleTime: 5 * 60 * 1000,
    });
    qc.prefetchQuery({
      queryKey: ['comments'],
      queryFn: () => actor.getComments(),
      staleTime: 5 * 60 * 1000,
    });
  }, [actor, qc]);

  const handleNavigate = useCallback((view: View) => {
    if (view === 'admin') {
      if (!isAdminUnlocked) {
        setShowPinDialog(true);
      } else {
        setCurrentView('admin');
      }
    } else {
      setCurrentView(view);
    }
  }, [isAdminUnlocked]);

  const handleAdminUnlock = useCallback(() => {
    setIsAdminUnlocked(true);
    setShowPinDialog(false);
    setCurrentView('admin');
  }, []);

  const handleAdminLock = useCallback(() => {
    setIsAdminUnlocked(false);
    setCurrentView('user');
  }, []);

  const handlePinCancel = useCallback(() => {
    setShowPinDialog(false);
  }, []);

  const LoadingFallback = (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col relative">
      <AnimatedBackground />
      <BackgroundMusicPlayer />
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        isAdminUnlocked={isAdminUnlocked}
        onAdminLock={handleAdminLock}
      />
      <main className="flex-1 relative z-10">
        <Suspense fallback={LoadingFallback}>
          {currentView === 'user' && <UserView />}
          {currentView === 'upload' && <UploadSection />}
          {currentView === 'live' && <LiveListChecker />}
          {currentView === 'admin' && isAdminUnlocked && <AdminPanel />}
        </Suspense>
      </main>
      <Footer />
      <AdminPinDialog
        open={showPinDialog}
        onOpenChange={setShowPinDialog}
        onSuccess={handleAdminUnlock}
        onCancel={handlePinCancel}
      />
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <AppContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
