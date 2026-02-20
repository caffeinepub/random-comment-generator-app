import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Lock } from 'lucide-react';
import { ADMIN_ACCESS_CODE } from '../utils/adminPinSession';

interface AdminPinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AdminPinDialog({
  open,
  onOpenChange,
  onSuccess,
  onCancel,
}: AdminPinDialogProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits and max 4 characters
    const digitsOnly = value.replace(/\D/g, '').slice(0, 4);
    setPin(digitsOnly);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate length
    if (pin.length !== 4) {
      setError('Please enter a 4-digit code');
      return;
    }

    setIsValidating(true);

    // Simulate brief validation delay for UX
    setTimeout(() => {
      if (pin === ADMIN_ACCESS_CODE) {
        // Success
        setPin('');
        setError('');
        setIsValidating(false);
        onSuccess();
      } else {
        // Wrong code
        setError('Incorrect access code. Please try again.');
        setIsValidating(false);
      }
    }, 300);
  };

  const handleCancel = () => {
    setPin('');
    setError('');
    setIsValidating(false);
    onCancel();
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleCancel();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl border-2 border-blue-200/50 dark:border-blue-800/50">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-2xl animate-pulse">
              <Shield className="w-10 h-10 text-white" />
            </div>
          </div>
          <DialogTitle className="text-3xl text-center font-extrabold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Admin Panel Access
          </DialogTitle>
          <DialogDescription className="text-center text-base text-muted-foreground">
            Enter the 4-digit access code to unlock the Admin Panel
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          <div className="space-y-3">
            <Label htmlFor="pin" className="text-sm font-semibold flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Access Code
            </Label>
            <Input
              id="pin"
              type="password"
              value={pin}
              onChange={handlePinChange}
              placeholder="••••"
              maxLength={4}
              disabled={isValidating}
              className={`h-16 text-center text-3xl tracking-[0.5em] rounded-2xl border-2 font-bold ${
                error ? 'border-destructive focus-visible:ring-destructive' : 'border-blue-300 dark:border-blue-700 focus-visible:ring-blue-500'
              }`}
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive font-medium flex items-center gap-2 animate-shake">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                {error}
              </p>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isValidating}
              className="w-full sm:flex-1 h-12 rounded-2xl border-2 font-semibold text-base hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pin.length !== 4 || isValidating}
              className="w-full sm:flex-1 h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-base disabled:opacity-50"
            >
              {isValidating ? (
                <>
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                'Unlock Admin Panel'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
