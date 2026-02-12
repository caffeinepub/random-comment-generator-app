import { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import AdminPanel from './pages/AdminPanel';
import UserView from './pages/UserView';
import UploadSection from './pages/UploadSection';
import AnimatedBackground from './components/AnimatedBackground';
import AdminPinDialog from './components/AdminPinDialog';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Upload as UploadIcon, Shield } from 'lucide-react';
import { useMidnightCommentListClear } from './hooks/useMidnightCommentListClear';

type AppView = 'customer' | 'upload' | 'admin';

function AppContent() {
  const [currentView, setCurrentView] = useState<AppView>('customer');
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(() => {
    try {
      return sessionStorage.getItem('adminUnlocked') === 'true';
    } catch {
      return false;
    }
  });

  useMidnightCommentListClear(isAdminUnlocked);

  const handleViewChange = (view: AppView) => {
    if (view === 'admin' && !isAdminUnlocked) {
      setShowPinDialog(true);
    } else {
      setCurrentView(view);
    }
  };

  const handlePinSuccess = () => {
    try {
      sessionStorage.setItem('adminUnlocked', 'true');
    } catch {
      // Ignore storage errors
    }
    setIsAdminUnlocked(true);
    setShowPinDialog(false);
    setCurrentView('admin');
  };

  const handlePinCancel = () => {
    setShowPinDialog(false);
    if (currentView === 'admin' && !isAdminUnlocked) {
      setCurrentView('customer');
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('adminUnlocked');
    } catch {
      // Ignore storage errors
    }
    setIsAdminUnlocked(false);
    setCurrentView('customer');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-background to-[oklch(var(--gradient-start)/0.05)] relative overflow-hidden">
      <AnimatedBackground />
      <Header onLogout={handleLogout} isAdminUnlocked={isAdminUnlocked} />
      
      <main className="flex-1 container mx-auto px-4 py-8 relative z-10">
        <Tabs value={currentView} onValueChange={(v) => handleViewChange(v as AppView)} className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 h-16 rounded-2xl p-1.5 bg-accent/50 mb-8">
            <TabsTrigger 
              value="customer" 
              className="text-base font-bold rounded-xl data-[state=active]:gradient-bg data-[state=active]:text-white transition-all duration-300 h-full"
            >
              <Users className="w-5 h-5 mr-2" />
              Customer View
            </TabsTrigger>
            <TabsTrigger 
              value="upload" 
              className="text-base font-bold rounded-xl data-[state=active]:gradient-bg data-[state=active]:text-white transition-all duration-300 h-full"
            >
              <UploadIcon className="w-5 h-5 mr-2" />
              Upload Section
            </TabsTrigger>
            <TabsTrigger 
              value="admin" 
              className="text-base font-bold rounded-xl data-[state=active]:gradient-bg data-[state=active]:text-white transition-all duration-300 h-full"
            >
              <Shield className="w-5 h-5 mr-2" />
              Admin Panel
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customer" className="mt-0">
            <UserView />
          </TabsContent>

          <TabsContent value="upload" className="mt-0">
            <UploadSection />
          </TabsContent>

          <TabsContent value="admin" className="mt-0">
            {isAdminUnlocked ? (
              <AdminPanel />
            ) : (
              <div className="flex items-center justify-center py-20">
                <div className="text-center space-y-6">
                  <div className="w-24 h-24 rounded-3xl gradient-bg-diagonal flex items-center justify-center shadow-2xl mx-auto animate-pulse-glow">
                    <Shield className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-3xl font-extrabold gradient-text">Admin Access Required</h2>
                  <p className="text-muted-foreground text-lg max-w-md mx-auto">
                    Please unlock the admin panel to continue
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />

      <AdminPinDialog
        open={showPinDialog}
        onOpenChange={setShowPinDialog}
        onSuccess={handlePinSuccess}
        onCancel={handlePinCancel}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AppContent />
        <Toaster />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
