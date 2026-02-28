import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function WalletPage() {
  // Mock wallet balance (in production, this would come from backend)
  const balance = 0;

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4 animate-fade-slide-in">
      <div className="text-center space-y-3">
        <h2 className="text-4xl font-extrabold gradient-text">Wallet</h2>
        <p className="text-muted-foreground text-lg">Manage your account balance</p>
      </div>

      <Card className="card-glow border-2 border-[oklch(var(--gradient-start)/0.2)] rounded-2xl overflow-hidden">
        <div className="absolute inset-0 gradient-bg-diagonal opacity-5 pointer-events-none" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            Current Balance
          </CardTitle>
          <CardDescription className="text-base">Your available funds</CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <div className="p-8 rounded-xl bg-gradient-to-br from-accent/30 to-accent/10 border-2 border-[oklch(var(--gradient-start)/0.2)] text-center">
            <p className="text-5xl font-extrabold gradient-text mb-2">₹{balance}</p>
            <Badge variant="outline" className="text-sm px-4 py-1 rounded-xl border-2 border-[oklch(var(--gradient-start)/0.5)]">
              <TrendingUp className="w-4 h-4 mr-1" />
              Available Balance
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="card-glow border-2 border-[oklch(var(--gradient-mid)/0.2)] rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl">Wallet Information</CardTitle>
          <CardDescription className="text-base">How your wallet works</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-xl bg-accent/20 border-2 border-[oklch(var(--gradient-mid)/0.2)]">
            <p className="text-sm text-muted-foreground">
              Your wallet balance can be used for various services and features within the platform.
              Contact the administrator to add funds to your wallet.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
