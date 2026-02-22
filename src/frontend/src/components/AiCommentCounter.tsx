import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3 } from 'lucide-react';
import { useGetAllAiComments } from '../hooks/useAiCommentQueries';

export default function AiCommentCounter() {
  const { data: aiComments = [] } = useGetAllAiComments();

  const totalComments = aiComments.length;

  return (
    <Card className="border-2 border-purple-200/50 dark:border-purple-800/50 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-950 dark:via-pink-950 dark:to-orange-950">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Total AI Comments</p>
              <p className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {totalComments}
              </p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="text-lg px-4 py-2 rounded-xl border-2 font-bold bg-white/50 dark:bg-gray-900/50"
          >
            {totalComments} Generated
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
