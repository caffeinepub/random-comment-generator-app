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
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl gradient-bg-diagonal flex items-center justify-center shadow-xl animate-pulse-glow">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl text-center gradient-text font-bold">
            Admin Panel Access
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Enter the 4-digit access code to unlock the Admin Panel
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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
              className={`h-14 text-center text-2xl tracking-widest rounded-xl border-2 ${
                error ? 'border-destructive' : 'border-[oklch(var(--gradient-start)/0.3)]'
              }`}
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                {error}
              </p>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isValidating}
              className="w-full sm:w-auto h-11 rounded-xl border-2 font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pin.length !== 4 || isValidating}
              className="w-full sm:w-auto h-11 rounded-xl gradient-bg btn-glow font-semibold"
            >
              {isValidating ? 'Verifying...' : 'Unlock Admin Panel'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
