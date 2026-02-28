import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Key, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function BulkGeneratorKeyManager() {
  const [currentKey, setCurrentKey] = useState('');
  const [newKey, setNewKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateKey = async () => {
    if (!newKey.trim()) {
      toast.error('Please enter a new access key');
      return;
    }

    setIsUpdating(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setCurrentKey(newKey);
    setNewKey('');
    setIsUpdating(false);
    toast.success('Access key updated successfully!');
  };

  const hasKey = currentKey.length > 0;

  return (
    <Card className="border-2 border-blue-200/50 dark:border-blue-800/50 rounded-3xl overflow-hidden shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover-lift">
      <CardHeader className="relative bg-gradient-to-r from-blue-500/10 via-teal-500/10 to-orange-500/10">
        <CardTitle className="flex items-center gap-3 text-2xl">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-110">
            <Key className="w-5 h-5 text-white" />
          </div>
          Bulk Generator Access Key
        </CardTitle>
        <CardDescription className="text-base">
          Manage the access key required for bulk comment generation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Current Status */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">CURRENT STATUS</Label>
          <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-blue-200/50 dark:border-blue-800/50 bg-gradient-to-br from-blue-50/50 to-teal-50/50 dark:from-blue-950/20 dark:to-teal-950/20">
            <span className="text-sm font-medium">Access Key</span>
            <Badge
              variant={hasKey ? 'default' : 'outline'}
              className={`px-3 py-1 rounded-xl ${
                hasKey
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'border-orange-500/50 text-orange-600 dark:text-orange-400'
              }`}
            >
              {hasKey ? 'Set' : 'Not Set'}
            </Badge>
          </div>
        </div>

        {/* Change Access Key */}
        <div className="space-y-3">
          <Label htmlFor="newKey" className="text-sm font-semibold">
            Change Access Key
          </Label>
          <p className="text-sm text-muted-foreground">
            Enter new access key...
          </p>
          <div className="relative">
            <Input
              id="newKey"
              type={showKey ? 'text' : 'password'}
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="Enter new access key..."
              className="h-12 text-base rounded-2xl border-2 pr-12 transition-all duration-200 focus:scale-[1.01] focus:ring-2 focus:ring-blue-500 hover:border-blue-400"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg hover:bg-blue-500/10 transition-all duration-200"
            >
              {showKey ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Important Notice */}
        <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border-2 border-blue-200/50 dark:border-blue-800/50">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Important:</strong> This key will be required by all users attempting to use the bulk comment
            generator. Keep it secure and share it only with authorized users.
          </p>
        </div>

        {/* Update Button */}
        <Button
          onClick={handleUpdateKey}
          disabled={!newKey.trim() || isUpdating}
          className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-95"
        >
          {isUpdating ? (
            <>
              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Updating...
            </>
          ) : (
            <>
              <Key className="w-6 h-6 mr-2" />
              Update Key
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
