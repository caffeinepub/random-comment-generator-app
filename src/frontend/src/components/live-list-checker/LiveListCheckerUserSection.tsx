import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, CheckCircle2, Clock, XCircle, Mail, Info } from 'lucide-react';
import { SiWhatsapp } from 'react-icons/si';
import { useCheckNameAvailability, useCreateClaim, useGetClaimStatus, useGetContactInfo } from '../../hooks/useQueries';
import { getStatusStyle } from './statusStyles';
import type { ClaimStatus } from '../../types/liveListChecker';

export default function LiveListCheckerUserSection() {
  const [nameInput, setNameInput] = useState('');
  const [searchedName, setSearchedName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [showClaimForm, setShowClaimForm] = useState(false);

  const { data: isAvailable, isLoading: checkingAvailability } = useCheckNameAvailability(searchedName);
  const { data: claimStatus, isLoading: loadingClaimStatus } = useGetClaimStatus(searchedName);
  const { data: contactInfo, isLoading: loadingContactInfo } = useGetContactInfo();
  const createClaimMutation = useCreateClaim();

  const handleSearch = () => {
    const trimmedName = nameInput.trim();
    if (trimmedName) {
      setSearchedName(trimmedName);
      setShowClaimForm(false);
      setUpiId('');
    }
  };

  const handleClaim = async () => {
    if (!searchedName || !upiId.trim()) return;
    
    try {
      await createClaimMutation.mutateAsync({ name: searchedName, upiId: upiId.trim() });
      setShowClaimForm(false);
      setUpiId('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getStatusDisplay = () => {
    if (checkingAvailability || loadingClaimStatus) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Checking status...</span>
        </div>
      );
    }

    if (claimStatus) {
      const style = getStatusStyle(claimStatus.status);
      const Icon = claimStatus.status === 'approved' ? CheckCircle2 : 
                   claimStatus.status === 'pending' ? Clock : XCircle;
      
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge className={`${style.className} border px-3 py-1 font-semibold`}>
              <Icon className="w-4 h-4 mr-1.5" />
              {style.label}
            </Badge>
          </div>
          {claimStatus.status === 'pending' && (
            <p className="text-sm text-muted-foreground">
              Your claim is being reviewed. You'll be notified once it's processed.
            </p>
          )}
          {claimStatus.status === 'approved' && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
              Congratulations! Your claim has been approved.
            </p>
          )}
          {claimStatus.status === 'rejected' && (
            <p className="text-sm text-red-600 dark:text-red-400">
              Your claim was not approved. Please contact support for more information.
            </p>
          )}
        </div>
      );
    }

    if (searchedName) {
      if (isAvailable) {
        const style = getStatusStyle('available');
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className={`${style.className} border px-3 py-1 font-semibold`}>
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                {style.label}
              </Badge>
            </div>
            {!showClaimForm && (
              <Button 
                onClick={() => setShowClaimForm(true)}
                className="llc-button w-full sm:w-auto"
              >
                Claim This Name
              </Button>
            )}
          </div>
        );
      } else {
        const style = getStatusStyle('taken');
        return (
          <div className="space-y-2">
            <Badge className={`${style.className} border px-3 py-1 font-semibold`}>
              <XCircle className="w-4 h-4 mr-1.5" />
              {style.label}
            </Badge>
            <p className="text-sm text-muted-foreground">
              This name has already been claimed by someone else.
            </p>
          </div>
        );
      }
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <Card className="llc-card border-2">
        <CardHeader>
          <CardTitle className="text-2xl font-bold llc-text-primary">Live List Checker</CardTitle>
          <CardDescription className="text-base">
            Check if your name is available and claim it with your UPI ID
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Instructions */}
          <div className="llc-info-box rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 llc-text-accent mt-0.5 flex-shrink-0" />
              <div className="space-y-1 text-sm">
                <p className="font-semibold llc-text-primary">How it works:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Enter your name and click "Check Availability"</li>
                  <li>If available, click "Claim This Name" and enter your UPI ID</li>
                  <li>Your claim will be reviewed by our team</li>
                  <li>You'll see the status update here once processed</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Name Search */}
          <div className="space-y-3">
            <Label htmlFor="name-input" className="text-base font-semibold">
              Enter Your Name
            </Label>
            <div className="flex gap-2">
              <Input
                id="name-input"
                type="text"
                placeholder="e.g., John Doe"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="llc-input"
              />
              <Button 
                onClick={handleSearch}
                disabled={!nameInput.trim() || checkingAvailability}
                className="llc-button-secondary"
              >
                {checkingAvailability ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Check
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Status Display */}
          {searchedName && (
            <div className="llc-status-box rounded-lg p-4 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Status for:</p>
                <p className="text-lg font-bold llc-text-primary">{searchedName}</p>
              </div>
              {getStatusDisplay()}
            </div>
          )}

          {/* Claim Form */}
          {showClaimForm && isAvailable && (
            <div className="llc-claim-form rounded-lg p-4 space-y-4 border-2 llc-border-accent">
              <div className="space-y-2">
                <Label htmlFor="upi-input" className="text-base font-semibold llc-text-primary">
                  UPI ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="upi-input"
                  type="text"
                  placeholder="yourname@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="llc-input"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter your UPI ID to complete the claim
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleClaim}
                  disabled={!upiId.trim() || createClaimMutation.isPending}
                  className="llc-button flex-1"
                >
                  {createClaimMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Claim'
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setShowClaimForm(false);
                    setUpiId('');
                  }}
                  variant="outline"
                  disabled={createClaimMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Info Card */}
      {contactInfo && (contactInfo.whatsappNumber || contactInfo.email || contactInfo.additionalInfo) && (
        <Card className="llc-card border-2">
          <CardHeader>
            <CardTitle className="text-xl font-bold llc-text-primary">Contact Information</CardTitle>
            <CardDescription>Get in touch with us for any queries</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {contactInfo.whatsappNumber && (
              <div className="flex items-center gap-3 p-3 llc-contact-item rounded-lg">
                <SiWhatsapp className="w-5 h-5 llc-text-accent" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">WhatsApp</p>
                  <p className="font-semibold llc-text-primary">{contactInfo.whatsappNumber}</p>
                </div>
              </div>
            )}
            {contactInfo.email && (
              <div className="flex items-center gap-3 p-3 llc-contact-item rounded-lg">
                <Mail className="w-5 h-5 llc-text-accent" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="font-semibold llc-text-primary">{contactInfo.email}</p>
                </div>
              </div>
            )}
            {contactInfo.additionalInfo && (
              <div className="flex items-start gap-3 p-3 llc-contact-item rounded-lg">
                <Info className="w-5 h-5 llc-text-accent mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Additional Info</p>
                  <p className="text-sm llc-text-primary">{contactInfo.additionalInfo}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
