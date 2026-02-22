import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Trash2 } from 'lucide-react';
import { useCreateAiComment, useClearAllAiComments } from '../hooks/useAiCommentQueries';
import { toast } from 'sonner';
import AiCommentTable from './AiCommentTable';
import AiCommentCounter from './AiCommentCounter';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type CommentLength = 'short' | 'medium' | 'long';

// Enhanced comment generation with varied structures and vocabulary
const ADJECTIVES = [
  'amazing', 'excellent', 'fantastic', 'wonderful', 'brilliant', 'outstanding', 'superb', 
  'incredible', 'awesome', 'remarkable', 'impressive', 'phenomenal', 'exceptional', 'terrific',
  'splendid', 'magnificent', 'marvelous', 'fabulous', 'stellar', 'top-notch'
];

const VERBS = [
  'love', 'enjoy', 'appreciate', 'recommend', 'adore', 'cherish', 'value', 'praise',
  'admire', 'treasure', 'favor', 'prefer', 'endorse', 'support', 'celebrate'
];

const PHRASES = [
  'This app is', 'I find this', 'Really', 'Absolutely', 'Truly', 'Genuinely',
  'Without a doubt', 'Honestly', 'Must say', 'Have to admit', 'Can confirm'
];

const FEATURES = [
  'the interface', 'the design', 'the functionality', 'the features', 'the performance',
  'the user experience', 'the ease of use', 'the reliability', 'the speed', 'the quality'
];

const ENDINGS = [
  'Highly recommended!', 'Worth every download!', 'Five stars!', 'Best in class!',
  'Can\'t live without it!', 'A must-have!', 'Simply the best!', 'Exceeded expectations!',
  'Absolutely perfect!', 'Game changer!', 'Life saver!', 'Top tier quality!'
];

function generateUniqueComment(length: CommentLength, ratingSymbol: string): string {
  const seed = Date.now() + Math.random();
  const random = (arr: string[]) => arr[Math.floor((seed * Math.random() * arr.length) % arr.length)];
  
  const adj = random(ADJECTIVES);
  const verb = random(VERBS);
  const phrase = random(PHRASES);
  const feature = random(FEATURES);
  const ending = random(ENDINGS);
  
  // Generate different sentence structures
  const structures = [
    `${phrase} ${adj}! I ${verb} ${feature}. ${ending} ${ratingSymbol}`,
    `${adj.charAt(0).toUpperCase() + adj.slice(1)} app! ${phrase} this is ${adj}. ${ending} ${ratingSymbol}`,
    `I ${verb} this app! ${feature.charAt(0).toUpperCase() + feature.slice(1)} is ${adj}. ${ending} ${ratingSymbol}`,
    `${ending} ${phrase} ${adj} and I ${verb} ${feature}. ${ratingSymbol}`,
    `This is ${adj}! ${feature.charAt(0).toUpperCase() + feature.slice(1)} works perfectly. ${ending} ${ratingSymbol}`,
  ];
  
  let comment = structures[Math.floor(seed % structures.length)];
  
  // Add extra content based on length
  if (length === 'medium') {
    const extra = [
      ` The developers did an ${adj} job.`,
      ` Everything works smoothly and efficiently.`,
      ` I've been using it daily and love it.`,
      ` The attention to detail is impressive.`,
      ` Updates keep making it better.`,
    ];
    comment += extra[Math.floor((seed * 2) % extra.length)];
  } else if (length === 'long') {
    const extra1 = [
      ` The developers did an ${adj} job with every aspect.`,
      ` Everything works smoothly, efficiently, and reliably.`,
      ` I've been using it daily for weeks and it keeps getting better.`,
      ` The attention to detail in every feature is truly impressive.`,
      ` Regular updates keep adding value and improvements.`,
    ];
    const extra2 = [
      ` The user interface is intuitive and beautiful.`,
      ` Performance is lightning fast on my device.`,
      ` Customer support is responsive and helpful.`,
      ` It's clear the team cares about quality.`,
      ` This sets the standard for similar apps.`,
    ];
    comment += extra1[Math.floor((seed * 2) % extra1.length)];
    comment += extra2[Math.floor((seed * 3) % extra2.length)];
  }
  
  return comment;
}

export default function AiCommentGenerator() {
  const [appLinkOrName, setAppLinkOrName] = useState('');
  const [ratingSymbol, setRatingSymbol] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [commentLength, setCommentLength] = useState<CommentLength>('medium');
  const { mutate: createAiComment, isPending: isGenerating } = useCreateAiComment();
  const { mutate: clearAllComments, isPending: isClearing } = useClearAllAiComments();

  const handleGenerate = useCallback(() => {
    if (!appLinkOrName.trim()) {
      toast.error('Please enter an app link or name');
      return;
    }

    if (!ratingSymbol.trim()) {
      toast.error('Please enter a rating symbol/tag');
      return;
    }

    const quantityNum = parseInt(quantity, 10);
    if (isNaN(quantityNum) || quantityNum < 1 || quantityNum > 50) {
      toast.error('Please enter a valid quantity (1-50)');
      return;
    }

    let successCount = 0;
    const totalToGenerate = quantityNum;

    for (let i = 0; i < totalToGenerate; i++) {
      const uniqueComment = generateUniqueComment(commentLength, ratingSymbol.trim());

      createAiComment(
        {
          content: uniqueComment,
          appLinkOrName: appLinkOrName.trim(),
          ratingSymbol: ratingSymbol.trim(),
        },
        {
          onSuccess: () => {
            successCount++;
            if (successCount === totalToGenerate) {
              setAppLinkOrName('');
              setRatingSymbol('');
              setQuantity('1');
              toast.success(`${successCount} comment${successCount !== 1 ? 's' : ''} generated successfully!`);
            }
          },
          onError: (error) => {
            toast.error(`Failed to generate comment: ${error.message}`);
          },
        }
      );
    }
  }, [appLinkOrName, ratingSymbol, quantity, commentLength, createAiComment]);

  const handleClearAll = useCallback(() => {
    clearAllComments();
  }, [clearAllComments]);

  const isFormValid = useMemo(() => {
    const quantityNum = parseInt(quantity, 10);
    return appLinkOrName.trim() && ratingSymbol.trim() && !isNaN(quantityNum) && quantityNum >= 1 && quantityNum <= 50;
  }, [appLinkOrName, ratingSymbol, quantity]);

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="border-2 border-purple-200/50 dark:border-purple-800/50 rounded-3xl overflow-hidden shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl">
        <CardHeader className="relative bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-110">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            AI Comment Generator
          </CardTitle>
          <CardDescription className="text-base">
            Generate AI-powered app review comments with custom symbols
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Counter */}
          <AiCommentCounter />

          {/* Input Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="appLinkOrName" className="text-sm font-semibold">
                App Link or Name
              </Label>
              <Input
                id="appLinkOrName"
                value={appLinkOrName}
                onChange={(e) => setAppLinkOrName(e.target.value)}
                placeholder="Enter app link or name..."
                className="h-12 text-base rounded-2xl border-2 transition-all duration-200 focus:scale-[1.02] focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ratingSymbol" className="text-sm font-semibold">
                Rating Symbol/Tag
              </Label>
              <Input
                id="ratingSymbol"
                value={ratingSymbol}
                onChange={(e) => setRatingSymbol(e.target.value)}
                placeholder="Enter symbol/tag (e.g., ⭐⭐⭐⭐⭐)"
                className="h-12 text-base rounded-2xl border-2 transition-all duration-200 focus:scale-[1.02] focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="commentLength" className="text-sm font-semibold">
                Comment Length
              </Label>
              <Select value={commentLength} onValueChange={(value) => setCommentLength(value as CommentLength)}>
                <SelectTrigger className="h-12 text-base rounded-2xl border-2 transition-all duration-200 hover:scale-[1.01]">
                  <SelectValue placeholder="Select length" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="short" className="rounded-xl cursor-pointer">Short (50-100 words)</SelectItem>
                  <SelectItem value="medium" className="rounded-xl cursor-pointer">Medium (100-200 words)</SelectItem>
                  <SelectItem value="long" className="rounded-xl cursor-pointer">Long (200-300 words)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-sm font-semibold">
                Quantity (1-50)
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max="50"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter number of comments..."
                className="h-12 text-base rounded-2xl border-2 transition-all duration-200 focus:scale-[1.02] focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !isFormValid}
              className="flex-1 h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-95"
            >
              {isGenerating ? (
                <>
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6 mr-2" />
                  Generate Comments
                </>
              )}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={isClearing}
                  className="h-14 px-6 text-base font-bold rounded-2xl transition-all duration-200 hover:scale-[1.02] active:scale-95 hover:shadow-lg"
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl animate-scale-in">
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All AI Comments?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all AI-generated comments. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-2xl transition-all duration-200">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearAll}
                    className="rounded-2xl bg-destructive hover:bg-destructive/90 transition-all duration-200"
                  >
                    Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* AI Comments Table */}
      <AiCommentTable />
    </div>
  );
}
