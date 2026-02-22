import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import AnimatedBackground from './components/AnimatedBackground';
import AdminPinDialog from './components/AdminPinDialog';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Upload, ListCheck, Shield } from 'lucide-react';

// Lazy load heavy components for better performance
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const UserView = lazy(() => import('./pages/UserView'));
const UploadSection = lazy(() => import('./pages/UploadSection'));
const LiveListChecker = lazy(() => import('./pages/LiveListChecker'));

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('user');

  useEffect(() => {
    const unlocked = sessionStorage.getItem('adminUnlocked') === 'true';
    setIsAdminUnlocked(unlocked);
  }, []);

  const handleAdminUnlock = useCallback(() => {
    setIsAdminUnlocked(true);
    sessionStorage.setItem('adminUnlocked', 'true');
    setShowAdminDialog(false);
    setActiveTab('admin');
  }, []);

  const handleLogout = useCallback(() => {
    setIsAdminUnlocked(false);
    sessionStorage.removeItem('adminUnlocked');
    setActiveTab('user');
  }, []);

  const handleAdminDialogCancel = useCallback(() => {
    setShowAdminDialog(false);
  }, []);

  const handleAdminTabClick = useCallback(() => {
    if (!isAdminUnlocked) {
      setShowAdminDialog(true);
    }
  }, [isAdminUnlocked]);

  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-teal-50 to-orange-50 dark:from-gray-950 dark:via-blue-950 dark:to-teal-950 transition-colors duration-300">
          <AnimatedBackground />
          
          <Header onLogout={handleLogout} isAdminUnlocked={isAdminUnlocked} />

          <main className="flex-1 container mx-auto px-4 py-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 h-14 rounded-3xl p-1.5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-lg border-2 border-blue-200/50 dark:border-blue-800/50 mb-8 transition-all duration-300">
                <TabsTrigger
                  value="user"
                  className="text-sm font-bold rounded-2xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-teal-500 data-[state=active]:text-white transition-all duration-300"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  User View
                </TabsTrigger>
                <TabsTrigger
                  value="upload"
                  className="text-sm font-bold rounded-2xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-teal-500 data-[state=active]:text-white transition-all duration-300"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </TabsTrigger>
                <TabsTrigger
                  value="checker"
                  className="text-sm font-bold rounded-2xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-teal-500 data-[state=active]:text-white transition-all duration-300"
                >
                  <ListCheck className="w-4 h-4 mr-2" />
                  Live Checker
                </TabsTrigger>
                <TabsTrigger
                  value="admin"
                  onClick={handleAdminTabClick}
                  className="text-sm font-bold rounded-2xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-teal-500 data-[state=active]:text-white transition-all duration-300"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Admin
                </TabsTrigger>
              </TabsList>

              <Suspense fallback={<LoadingFallback />}>
                <TabsContent value="user" className="mt-0 animate-fade-in">
                  <UserView />
                </TabsContent>

                <TabsContent value="upload" className="mt-0 animate-fade-in">
                  <UploadSection />
                </TabsContent>

                <TabsContent value="checker" className="mt-0 animate-fade-in">
                  <LiveListChecker />
                </TabsContent>

                <TabsContent value="admin" className="mt-0 animate-fade-in">
                  {isAdminUnlocked ? <AdminPanel /> : <LoadingFallback />}
                </TabsContent>
              </Suspense>
            </Tabs>
          </main>

          <Footer />
          <Toaster />
          
          <AdminPinDialog
            open={showAdminDialog}
            onOpenChange={setShowAdminDialog}
            onSuccess={handleAdminUnlock}
            onCancel={handleAdminDialogCancel}
          />
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
