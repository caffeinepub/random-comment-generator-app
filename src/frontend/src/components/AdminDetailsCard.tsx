import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Phone, GraduationCap, Clock } from 'lucide-react';

export default function AdminDetailsCard() {
  return (
    <Card className="card-glow border-2 border-[oklch(var(--gradient-start)/0.3)] rounded-2xl overflow-hidden">
      <div className="absolute inset-0 gradient-bg-diagonal opacity-5 pointer-events-none" />
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-3 text-2xl">
          <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg">
            <User className="w-5 h-5 text-white" />
          </div>
          Admin Details
        </CardTitle>
        <CardDescription className="text-base">
          Administrator information and settings
        </CardDescription>
      </CardHeader>
      <CardContent className="relative space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wide">
              <User className="w-4 h-4" />
              Name
            </div>
            <p className="text-lg font-semibold">Nishant Chaudhary</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wide">
              <Phone className="w-4 h-4" />
              Contact Number
            </div>
            <p className="text-lg font-semibold">7088727417</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wide">
              <GraduationCap className="w-4 h-4" />
              Progression
            </div>
            <p className="text-lg font-semibold">student</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wide">
              <Clock className="w-4 h-4" />
              Payment Time
            </div>
            <p className="text-lg font-semibold">after 7 days</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
