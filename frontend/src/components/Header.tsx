import React from 'react';
import { MessageSquare, Upload, List, Shield, Lock, Unlock, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import MidnightCountdownTimer from './MidnightCountdownTimer';

type View = 'user' | 'upload' | 'live' | 'admin';

interface HeaderProps {
  currentView: View;
  onNavigate: (view: View) => void;
  isAdminUnlocked: boolean;
  onAdminLock: () => void;
}

const NAV_ITEMS: { id: View; label: string; icon: React.ReactNode }[] = [
  { id: 'user', label: 'User View', icon: <MessageSquare className="w-3.5 h-3.5" /> },
  { id: 'upload', label: 'Upload', icon: <Upload className="w-3.5 h-3.5" /> },
  { id: 'live', label: 'Live Checker', icon: <List className="w-3.5 h-3.5" /> },
  { id: 'admin', label: 'Admin', icon: <Shield className="w-3.5 h-3.5" /> },
];

export default function Header({ currentView, onNavigate, isAdminUnlocked, onAdminLock }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="relative z-20 border-b border-teal-500/20 bg-background/85 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4">
        {/* Top row: logo + countdown + controls */}
        <div className="flex items-center justify-between py-3 gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-sm bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent leading-tight">
                App Review
              </div>
              <div className="text-xs text-muted-foreground leading-tight">Comment Management</div>
            </div>
          </div>

          {/* Countdown */}
          <div className="flex-1 flex justify-center">
            <MidnightCountdownTimer compact />
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-8 h-8 rounded-lg border border-teal-500/20 bg-background/60 flex items-center justify-center text-muted-foreground hover:text-teal-400 hover:border-teal-500/40 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {isAdminUnlocked && (
              <>
                <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                  <Unlock className="w-3 h-3" />
                  Admin Unlocked
                </span>
                <button
                  onClick={onAdminLock}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-red-500/40 bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors"
                >
                  <Lock className="w-3 h-3" />
                  <span className="hidden sm:inline">Lock Admin</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Nav row */}
        <nav className="flex gap-1 pb-2 overflow-x-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                currentView === item.id
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-500 text-white shadow-sm shadow-teal-500/30'
                  : 'text-muted-foreground hover:text-teal-400 hover:bg-teal-500/10'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
