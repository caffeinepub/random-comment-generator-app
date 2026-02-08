import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

interface HeaderProps {
  onLogout?: () => void;
}

export default function Header({ onLogout }: HeaderProps) {
  const { clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

  const isAuthenticated = !!identity;
  const disabled = loginStatus === 'logging-in';

  const handleLogout = async () => {
    await clear();
    // Clear all cached queries
    queryClient.clear();
    // Call parent callback to clear admin unlock
    onLogout?.();
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="border-b-2 border-[oklch(var(--gradient-start)/0.2)] bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl gradient-bg-diagonal flex items-center justify-center shadow-xl animate-pulse-glow">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold gradient-text">
                Comment Generator
              </h1>
              <p className="text-xs text-muted-foreground font-medium">Random comment distribution</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-xl h-11 w-11 hover:bg-accent/50 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>

            {isAuthenticated && (
              <Button
                onClick={handleLogout}
                disabled={disabled}
                variant="outline"
                className="rounded-xl font-bold shadow-lg h-11 px-6 transition-all border-2 border-[oklch(var(--gradient-start)/0.3)] hover:border-[oklch(var(--gradient-start))]"
              >
                Logout
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
