import { Moon, Sun, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';

interface HeaderProps {
  onLogout: () => void;
  isAdminUnlocked: boolean;
}

export default function Header({ onLogout, isAdminUnlocked }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">RV</span>
          </div>
          <h1 className="text-xl font-bold gradient-text">Comment Generator</h1>
        </div>

        <div className="flex items-center gap-3">
          {isAdminUnlocked && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/50 border-2 border-[oklch(var(--gradient-start)/0.3)]">
              <Unlock className="w-4 h-4 text-[oklch(var(--gradient-start))]" />
              <span className="text-sm font-semibold">Admin Unlocked</span>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-xl h-10 w-10"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {isAdminUnlocked && (
            <Button
              variant="outline"
              onClick={onLogout}
              className="rounded-xl h-10 px-4 font-semibold border-2 hover:border-[oklch(var(--gradient-start))]"
            >
              <Lock className="w-4 h-4 mr-2" />
              Lock Admin
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
