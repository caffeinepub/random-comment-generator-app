import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t-2 border-[oklch(var(--gradient-start)/0.2)] bg-card/50 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center space-y-2">
          <div className="text-sm text-muted-foreground">
            © 2025. Built with{' '}
            <Heart className="inline w-4 h-4 text-[oklch(var(--gradient-start))] fill-[oklch(var(--gradient-start))] animate-pulse" />{' '}
            using{' '}
            <a
              href="https://caffeine.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold gradient-text hover:underline"
            >
              caffeine.ai
            </a>
          </div>
          <div className="text-xs text-muted-foreground/70 font-medium">
            Production Version 11
          </div>
        </div>
      </div>
    </footer>
  );
}
