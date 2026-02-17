import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Upload, CheckCircle2, XCircle, Clock, Settings, Phone } from 'lucide-react';
import { 
  useUploadNameList, 
  useGetAllClaims, 
  useApproveClaim, 
  useRejectClaim,
  useGetLiveListTotals,
  useSetLiveListSettings,
  useGetLiveListSettings,
  useSetContactInfo,
  useGetContactInfo
} from '../../hooks/useQueries';
import { getStatusStyle } from './statusStyles';
import type { ClaimStatus } from '../../types/liveListChecker';

export default function LiveListCheckerAdminSection() {
  const [nameListText, setNameListText] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | ClaimStatus>('all');
  
  // Settings state
  const [maxClaims, setMaxClaims] = useState('');
  const [perClaimAmount, setPerClaimAmount] = useState('');
  
  // Contact info state
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');

  const uploadNameListMutation = useUploadNameList();
  const { data: allClaims = [], isLoading: loadingClaims } = useGetAllClaims();
  const { data: totals, isLoading: loadingTotals } = useGetLiveListTotals();
  const { data: settings, isLoading: loadingSettings } = useGetLiveListSettings();
  const { data: contactInfo, isLoading: loadingContactInfo } = useGetContactInfo();
  const approveClaimMutation = useApproveClaim();
  const rejectClaimMutation = useRejectClaim();
  const setSettingsMutation = useSetLiveListSettings();
  const setContactInfoMutation = useSetContactInfo();

  // Initialize settings when loaded
  useState(() => {
    if (settings) {
      setMaxClaims(settings.maxClaims.toString());
      setPerClaimAmount(settings.perClaimAmount.toString());
    }
  });

  // Initialize contact info when loaded
  useState(() => {
    if (contactInfo) {
      setWhatsappNumber(contactInfo.whatsappNumber);
      setEmail(contactInfo.email);
      setAdditionalInfo(contactInfo.additionalInfo);
    }
  });

  const handleUploadNameList = async () => {
    const names = nameListText
      .split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0);
    
    if (names.length === 0) return;
    
    try {
      await uploadNameListMutation.mutateAsync(names);
      setNameListText('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleSaveSettings = async () => {
    const max = BigInt(maxClaims || '0');
    const amount = BigInt(perClaimAmount || '0');
    
    try {
      await setSettingsMutation.mutateAsync({ maxClaims: max, perClaimAmount: amount });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleSaveContactInfo = async () => {
    try {
      await setContactInfoMutation.mutateAsync({
        whatsappNumber: whatsappNumber.trim(),
        email: email.trim(),
        additionalInfo: additionalInfo.trim(),
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const filteredClaims = allClaims.filter(claim => 
    filterStatus === 'all' || claim.status === filterStatus
  );

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 llc-tabs">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="upload">Upload List</TabsTrigger>
          <TabsTrigger value="claims">Claims</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="llc-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
                <Clock className="h-4 w-4 llc-text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold llc-text-primary">
                  {loadingTotals ? '...' : totals?.pendingCount.toString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Amount: ₹{loadingTotals ? '...' : totals?.pendingTotalAmount.toString() || '0'}
                </p>
              </CardContent>
            </Card>

            <Card className="llc-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved Claims</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold llc-text-primary">
                  {loadingTotals ? '...' : totals?.approvedCount.toString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Amount: ₹{loadingTotals ? '...' : totals?.approvedTotalAmount.toString() || '0'}
                </p>
              </CardContent>
            </Card>

            <Card className="llc-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected Claims</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold llc-text-primary">
                  {loadingTotals ? '...' : totals?.rejectedCount.toString() || '0'}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="llc-card">
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Claims</span>
                <span className="font-bold llc-text-primary">
                  {loadingTotals ? '...' : (
                    (totals?.pendingCount || BigInt(0)) + 
                    (totals?.approvedCount || BigInt(0)) + 
                    (totals?.rejectedCount || BigInt(0))
                  ).toString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Max Claims Limit</span>
                <span className="font-bold llc-text-primary">
                  {loadingSettings ? '...' : settings?.maxClaims.toString() || '0'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Per Claim Amount</span>
                <span className="font-bold llc-text-primary">
                  ₹{loadingSettings ? '...' : settings?.perClaimAmount.toString() || '0'}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upload List Tab */}
        <TabsContent value="upload" className="space-y-4">
          <Card className="llc-card">
            <CardHeader>
              <CardTitle className="llc-text-primary">Upload Name List</CardTitle>
              <CardDescription>
                Paste or type names (one per line) to create/replace the active list
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name-list-textarea">Name List</Label>
                <Textarea
                  id="name-list-textarea"
                  placeholder="John Doe&#10;Jane Smith&#10;Bob Johnson&#10;..."
                  value={nameListText}
                  onChange={(e) => setNameListText(e.target.value)}
                  rows={12}
                  className="llc-input font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {nameListText.split('\n').filter(n => n.trim()).length} names entered
                </p>
              </div>
              <Button
                onClick={handleUploadNameList}
                disabled={!nameListText.trim() || uploadNameListMutation.isPending}
                className="llc-button w-full"
              >
                {uploadNameListMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Name List
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Claims Tab */}
        <TabsContent value="claims" className="space-y-4">
          <Card className="llc-card">
            <CardHeader>
              <CardTitle className="llc-text-primary">Claim Management</CardTitle>
              <CardDescription>Review and manage all claims</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('all')}
                  size="sm"
                  className={filterStatus === 'all' ? 'llc-button' : ''}
                >
                  All ({allClaims.length})
                </Button>
                <Button
                  variant={filterStatus === 'pending' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('pending')}
                  size="sm"
                  className={filterStatus === 'pending' ? 'llc-button' : ''}
                >
                  Pending ({allClaims.filter(c => c.status === 'pending').length})
                </Button>
                <Button
                  variant={filterStatus === 'approved' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('approved')}
                  size="sm"
                  className={filterStatus === 'approved' ? 'llc-button' : ''}
                >
                  Approved ({allClaims.filter(c => c.status === 'approved').length})
                </Button>
                <Button
                  variant={filterStatus === 'rejected' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('rejected')}
                  size="sm"
                  className={filterStatus === 'rejected' ? 'llc-button' : ''}
                >
                  Rejected ({allClaims.filter(c => c.status === 'rejected').length})
                </Button>
              </div>

              <ScrollArea className="h-[500px] rounded-md border">
                {loadingClaims ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="w-6 h-6 animate-spin llc-text-accent" />
                  </div>
                ) : filteredClaims.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    No claims found
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>UPI ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClaims.map((claim) => {
                        const style = getStatusStyle(claim.status);
                        return (
                          <TableRow key={claim.id}>
                            <TableCell className="font-medium">{claim.name}</TableCell>
                            <TableCell className="font-mono text-sm">{claim.upiId}</TableCell>
                            <TableCell>
                              <Badge className={`${style.className} border`}>
                                {style.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatTimestamp(claim.timestamp)}
                            </TableCell>
                            <TableCell>
                              {claim.status === 'pending' && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => approveClaimMutation.mutate(claim.id)}
                                    disabled={approveClaimMutation.isPending}
                                    className="llc-button-approve"
                                  >
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => rejectClaimMutation.mutate(claim.id)}
                                    disabled={rejectClaimMutation.isPending}
                                  >
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card className="llc-card">
            <CardHeader>
              <CardTitle className="llc-text-primary">Limits & Amounts</CardTitle>
              <CardDescription>Configure claim limits and per-claim amounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="max-claims">Maximum Claims</Label>
                <Input
                  id="max-claims"
                  type="number"
                  placeholder="e.g., 100"
                  value={maxClaims}
                  onChange={(e) => setMaxClaims(e.target.value)}
                  className="llc-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="per-claim-amount">Per Claim Amount (₹)</Label>
                <Input
                  id="per-claim-amount"
                  type="number"
                  placeholder="e.g., 500"
                  value={perClaimAmount}
                  onChange={(e) => setPerClaimAmount(e.target.value)}
                  className="llc-input"
                />
              </div>
              <Button
                onClick={handleSaveSettings}
                disabled={setSettingsMutation.isPending}
                className="llc-button w-full"
              >
                {setSettingsMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="llc-card">
            <CardHeader>
              <CardTitle className="llc-text-primary">Contact Information</CardTitle>
              <CardDescription>Set contact details visible to users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp Number</Label>
                <Input
                  id="whatsapp"
                  type="text"
                  placeholder="+91 98765 43210"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="llc-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-contact">Email</Label>
                <Input
                  id="email-contact"
                  type="email"
                  placeholder="support@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="llc-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="additional-info">Additional Information</Label>
                <Textarea
                  id="additional-info"
                  placeholder="Any additional contact details or instructions..."
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  rows={3}
                  className="llc-input"
                />
              </div>
              <Button
                onClick={handleSaveContactInfo}
                disabled={setContactInfoMutation.isPending}
                className="llc-button w-full"
              >
                {setContactInfoMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Phone className="w-4 h-4 mr-2" />
                    Save Contact Info
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
