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
import { Key } from 'lucide-react';

interface AccessKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (key: string) => void;
  isLoading?: boolean;
}

export default function AccessKeyDialog({ open, onOpenChange, onSubmit, isLoading = false }: AccessKeyDialogProps) {
  const [accessKey, setAccessKey] = useState('');

  const handleSubmit = () => {
    if (accessKey.trim()) {
      onSubmit(accessKey.trim());
      setAccessKey('');
    }
  };

  const handleCancel = () => {
    setAccessKey('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg">
              <Key className="w-5 h-5 text-white" />
            </div>
            Access Key Required
          </DialogTitle>
          <DialogDescription className="text-base">
            Please enter the Bulk Generator access key to proceed with bulk comment generation.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="accessKey" className="text-sm font-semibold">
              Access Key
            </Label>
            <Input
              id="accessKey"
              type="password"
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
              placeholder="Enter access key..."
              disabled={isLoading}
              className="h-12 rounded-xl border-2 text-base"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && accessKey.trim()) {
                  handleSubmit();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="rounded-xl border-2"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!accessKey.trim() || isLoading}
            className="rounded-xl gradient-bg btn-glow"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Verifying...
              </>
            ) : (
              'Submit'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
