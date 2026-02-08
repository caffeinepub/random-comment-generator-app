import { useState } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import Header from './components/Header';
import Footer from './components/Footer';
import AdminPanel from './pages/AdminPanel';
import UserView from './pages/UserView';
import UploadSection from './pages/UploadSection';
import ChatBox from './components/ChatBox';
import AnimatedBackground from './components/AnimatedBackground';
import AdminPinDialog from './components/AdminPinDialog';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Shield, Users, Upload } from 'lucide-react';

type ViewMode = 'admin' | 'customer' | 'upload';

export default function App() {
  const { isInitializing } = useInternetIdentity();
  const [viewMode, setViewMode] = useState<ViewMode>('customer');
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(() => {
    // Check sessionStorage on mount
    return sessionStorage.getItem('adminUnlocked') === 'true';
  });

  if (isInitializing) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-[oklch(var(--gradient-start)/0.1)]">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 border-4 border-transparent border-t-[oklch(var(--gradient-start))] rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground text-lg font-medium">Loading...</p>
          </div>
        </div>
        <Toaster />
      </ThemeProvider>
    );
  }

  const handleAdminClick = () => {
    if (isAdminUnlocked) {
      // Already unlocked, navigate directly
      setViewMode('admin');
    } else {
      // Show PIN dialog
      setShowPinDialog(true);
    }
  };

  const handlePinSuccess = () => {
    // Mark as unlocked in session
    sessionStorage.setItem('adminUnlocked', 'true');
    setIsAdminUnlocked(true);
    setShowPinDialog(false);
    setViewMode('admin');
  };

  const handlePinCancel = () => {
    setShowPinDialog(false);
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-background to-[oklch(var(--gradient-start)/0.05)] relative overflow-hidden">
        <AnimatedBackground />
        <Header onLogout={() => {
          // Clear admin unlock on logout
          sessionStorage.removeItem('adminUnlocked');
          setIsAdminUnlocked(false);
          if (viewMode === 'admin') {
            setViewMode('customer');
          }
        }} />
        
        {/* Navigation Menu */}
        <nav className="border-b-2 border-[oklch(var(--gradient-start)/0.2)] bg-card/80 backdrop-blur-md sticky top-[73px] z-40 shadow-md">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button
                onClick={() => setViewMode('customer')}
                variant={viewMode === 'customer' ? 'default' : 'outline'}
                className={`h-11 px-6 rounded-xl font-bold transition-all duration-300 ${
                  viewMode === 'customer'
                    ? 'gradient-bg btn-glow'
                    : 'border-2 border-[oklch(var(--gradient-mid)/0.3)] hover:border-[oklch(var(--gradient-mid))] hover:bg-gradient-to-r hover:from-[oklch(var(--gradient-mid)/0.1)] hover:to-[oklch(var(--gradient-end)/0.1)]'
                }`}
              >
                <Users className="w-5 h-5 mr-2" />
                Customer View
              </Button>
              <Button
                onClick={handleAdminClick}
                variant={viewMode === 'admin' ? 'default' : 'outline'}
                className={`h-11 px-6 rounded-xl font-bold transition-all duration-300 ${
                  viewMode === 'admin'
                    ? 'gradient-bg btn-glow'
                    : 'border-2 border-[oklch(var(--gradient-start)/0.3)] hover:border-[oklch(var(--gradient-start))] hover:bg-gradient-to-r hover:from-[oklch(var(--gradient-start)/0.1)] hover:to-[oklch(var(--gradient-mid)/0.1)]'
                }`}
              >
                <Shield className="w-5 h-5 mr-2" />
                Admin Panel
              </Button>
              <Button
                onClick={() => setViewMode('upload')}
                variant={viewMode === 'upload' ? 'default' : 'outline'}
                className={`h-11 px-6 rounded-xl font-bold transition-all duration-300 ${
                  viewMode === 'upload'
                    ? 'gradient-bg btn-glow'
                    : 'border-2 border-[oklch(var(--gradient-end)/0.3)] hover:border-[oklch(var(--gradient-end))] hover:bg-gradient-to-r hover:from-[oklch(var(--gradient-end)/0.1)] hover:to-[oklch(var(--gradient-start)/0.1)]'
                }`}
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload Section
              </Button>
            </div>
          </div>
        </nav>

        <main className="flex-1 container mx-auto px-4 py-8 relative z-10">
          {viewMode === 'admin' && <AdminPanel />}
          {viewMode === 'customer' && <UserView />}
          {viewMode === 'upload' && <UploadSection />}
        </main>
        <Footer />
        <ChatBox />
        <Toaster />

        {/* Admin PIN Dialog */}
        <AdminPinDialog
          open={showPinDialog}
          onOpenChange={setShowPinDialog}
          onSuccess={handlePinSuccess}
          onCancel={handlePinCancel}
        />
      </div>
    </ThemeProvider>
  );
}
