import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Phone, CreditCard } from 'lucide-react';

export default function ProfilePage() {
  // Read profile from localStorage (legacy auth system data)
  const profileData = localStorage.getItem('userProfile');
  const profile = profileData ? JSON.parse(profileData) : null;

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card className="card-glow border-2 border-[oklch(var(--gradient-start)/0.2)] rounded-2xl">
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">No profile data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4 animate-fade-slide-in">
      <div className="text-center space-y-3">
        <h2 className="text-4xl font-extrabold gradient-text">Profile</h2>
        <p className="text-muted-foreground text-lg">Your account information</p>
      </div>

      <Card className="card-glow border-2 border-[oklch(var(--gradient-start)/0.2)] rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl gradient-text font-bold">Account Details</CardTitle>
          <CardDescription className="text-base">Your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-accent/20 border-2 border-[oklch(var(--gradient-start)/0.2)]">
            <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground font-semibold">Name</p>
              <p className="text-lg font-bold">{profile.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-accent/20 border-2 border-[oklch(var(--gradient-mid)/0.2)]">
            <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground font-semibold">Email</p>
              <p className="text-lg font-bold">{profile.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-accent/20 border-2 border-[oklch(var(--gradient-end)/0.2)]">
            <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground font-semibold">Mobile Number</p>
              <p className="text-lg font-bold">{profile.mobileNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-accent/20 border-2 border-[oklch(var(--gradient-start)/0.2)]">
            <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground font-semibold">UPI Details</p>
              <p className="text-lg font-bold">{profile.upiDetails}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
