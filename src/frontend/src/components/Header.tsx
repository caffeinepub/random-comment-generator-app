import { Moon, Sun, Lock } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MidnightCountdownTimer from './MidnightCountdownTimer';

interface HeaderProps {
  onLogout: () => void;
  isAdminUnlocked: boolean;
}

export default function Header({ onLogout, isAdminUnlocked }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-blue-200/50 dark:border-blue-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-lg transition-all duration-300">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-teal-500 to-orange-500 flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-110">
              <span className="text-2xl font-black text-white">A</span>
            </div>
            <div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 via-teal-600 to-orange-600 bg-clip-text text-transparent leading-tight">
                App Review
              </h1>
              <p className="text-xs text-muted-foreground font-medium">Comment Management</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <MidnightCountdownTimer />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-10 w-10 rounded-full hover:bg-blue-500/10 transition-all duration-300"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {isAdminUnlocked && (
            <>
              <Badge
                variant="outline"
                className="px-3 py-1.5 rounded-full border-2 border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400 font-bold transition-all duration-300 hover:scale-105"
              >
                Admin Unlocked
              </Badge>
              <Button
                onClick={onLogout}
                variant="outline"
                size="sm"
                className="h-9 px-4 rounded-full border-2 border-red-500/50 text-red-600 dark:text-red-400 hover:bg-red-500/10 font-semibold transition-all duration-300"
              >
                <Lock className="w-4 h-4 mr-2" />
                Lock Admin
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
