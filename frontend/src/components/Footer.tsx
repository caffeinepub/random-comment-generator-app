import React from 'react';
import { Heart } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();
  const appId = encodeURIComponent(
    typeof window !== 'undefined' ? window.location.hostname : 'app-review-tool'
  );

  return (
    <footer className="relative z-10 border-t border-teal-500/15 bg-background/80 backdrop-blur-sm py-4 px-4">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>© {year} App Review Tool</span>
        <span className="flex items-center gap-1.5">
          Built with{' '}
          <Heart className="w-3.5 h-3.5 text-teal-400 fill-teal-400" />
          {' '}using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-400 hover:text-emerald-400 transition-colors font-medium"
          >
            caffeine.ai
          </a>
        </span>
      </div>
    </footer>
  );
}
