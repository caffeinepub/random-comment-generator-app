import { useState } from 'react';
import { useGetBulkGeneratorKey, useSetBulkGeneratorKey, useResetBulkGeneratorKey } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Key, Eye, EyeOff, AlertCircle, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function BulkGeneratorKeyManager() {
  const [newKey, setNewKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  const { data: currentKey, isLoading: isLoadingKey } = useGetBulkGeneratorKey(true);
  const { mutate: setKey, isPending: isSettingKey } = useSetBulkGeneratorKey();
  const { mutate: resetKey, isPending: isResettingKey } = useResetBulkGeneratorKey();

  const handleSetKey = () => {
    if (!newKey.trim()) {
      return;
    }

    setKey(newKey.trim(), {
      onSuccess: () => {
        setNewKey('');
        setShowKey(false);
      },
    });
  };

  const handleResetKey = () => {
    resetKey();
  };

  const isKeySet = currentKey !== null;

  return (
    <Card className="card-glow border-2 border-[oklch(var(--gradient-start)/0.2)] rounded-2xl overflow-hidden">
      <div className="absolute inset-0 gradient-bg-diagonal opacity-5 pointer-events-none" />
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-3 text-2xl">
          <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg">
            <Key className="w-5 h-5 text-white" />
          </div>
          Bulk Generator Access Key
        </CardTitle>
        <CardDescription className="text-base">
          Manage the access key required for bulk comment generation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 relative">
        {/* Current Key Status */}
        <div className="p-5 rounded-xl border-2 bg-gradient-to-br from-accent/20 to-accent/5 border-[oklch(var(--gradient-start)/0.2)]">
          <div className="flex items-center justify-between gap-4 mb-3">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
              Current Status
            </p>
            <Badge
              variant={isKeySet ? 'default' : 'secondary'}
              className={`font-semibold ${isKeySet ? 'gradient-bg border-0' : ''}`}
            >
              {isLoadingKey ? 'Loading...' : isKeySet ? 'Key Set' : 'Not Set'}
            </Badge>
          </div>
          {isKeySet && currentKey && (
            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground">Masked Key:</p>
                <p className="text-base font-mono bg-accent/30 px-3 py-2 rounded border border-[oklch(var(--gradient-start)/0.2)]">
                  {currentKey}
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isResettingKey}
                    className="w-full h-10 rounded-xl border-2 border-destructive/30 hover:border-destructive hover:bg-destructive/10"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {isResettingKey ? 'Resetting...' : 'Reset Key'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl">Reset Bulk Generator Key?</AlertDialogTitle>
                    <AlertDialogDescription className="text-base">
                      This will remove the current access key. Users will not be able to use bulk comment generation until a new key is set. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetKey} className="rounded-xl bg-destructive hover:bg-destructive/90">
                      Reset Key
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
          {!isKeySet && (
            <div className="flex items-start gap-2 mt-2">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                No access key has been set. Bulk comment generation will not work until a key is configured.
              </p>
            </div>
          )}
        </div>

        {/* Set/Change Key Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newKey" className="text-sm font-semibold">
              {isKeySet ? 'Change Access Key' : 'Set Access Key'}
            </Label>
            <div className="relative">
              <Input
                id="newKey"
                type={showKey ? 'text' : 'password'}
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="Enter new access key..."
                disabled={isSettingKey}
                className="h-12 rounded-xl border-2 text-base pr-12"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-1 top-1 h-10 w-10 rounded-lg"
                disabled={isSettingKey}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-accent/20 border-2 border-[oklch(var(--gradient-start)/0.2)]">
            <p className="text-sm text-muted-foreground">
              <strong>Important:</strong> This key will be required by all users attempting to use the bulk comment generator. Keep it secure and share it only with authorized users.
            </p>
          </div>

          <Button
            onClick={handleSetKey}
            disabled={!newKey.trim() || isSettingKey}
            className="w-full h-12 rounded-xl gradient-bg btn-glow font-bold text-base"
          >
            {isSettingKey ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Key className="w-5 h-5 mr-2" />
                {isKeySet ? 'Update Key' : 'Set Key'}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
