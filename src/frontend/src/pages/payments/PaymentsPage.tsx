import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Receipt, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function PaymentsPage() {
  // Mock payment history - in production this would come from backend
  const payments: any[] = [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl gradient-bg-diagonal flex items-center justify-center shadow-xl animate-pulse-glow">
          <Receipt className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-4xl font-extrabold gradient-text">Payment History</h2>
          <p className="text-muted-foreground text-lg">Track your payment transactions and status</p>
        </div>
      </div>

      <Card className="card-glow border-2 border-[oklch(var(--gradient-start)/0.3)] rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Receipt className="w-6 h-6 text-[oklch(var(--gradient-start))]" />
            All Transactions
          </CardTitle>
          <CardDescription className="text-base">
            View all your payment records with current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-lg font-semibold text-muted-foreground mb-2">No payment history</p>
              <p className="text-sm text-muted-foreground">
                Your payment transactions will appear here
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="p-5 rounded-xl border-2 bg-gradient-to-br from-accent/20 to-accent/5 border-[oklch(var(--gradient-start)/0.2)] hover:border-[oklch(var(--gradient-start)/0.4)] transition-all"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <p className="text-lg font-bold mb-1">₹{payment.amount}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(Number(payment.timestamp) / 1000000).toLocaleString()}
                        </p>
                      </div>
                      {getStatusBadge(payment.status)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Transaction ID: {payment.id}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
