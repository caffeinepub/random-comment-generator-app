import React from 'react';
import { Image, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useActor } from '../hooks/useActor';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminImagesPanel() {
  const { actor, isFetching } = useActor();

  const { data: images = [], isLoading } = useQuery({
    queryKey: ['ratingImages'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getImages();
    },
    enabled: !!actor && !isFetching,
    staleTime: 2 * 60 * 1000,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30 flex items-center justify-center">
          <Image className="w-5 h-5 text-teal-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Rating Images</h2>
          <p className="text-sm text-muted-foreground">View uploaded rating screenshots</p>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-card border border-teal-500/20 rounded-xl p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
            <Image className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{images.length}</p>
            <p className="text-xs text-muted-foreground">Total Images</p>
          </div>
        </div>
      </div>

      {/* Images grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Image className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No images uploaded yet</p>
          <p className="text-xs mt-1">Images uploaded in the Upload section will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {images.map(img => (
            <div key={img.id} className="bg-card border border-teal-500/20 rounded-xl overflow-hidden group hover:border-teal-500/40 transition-all">
              <div className="aspect-video bg-teal-500/5 flex items-center justify-center overflow-hidden">
                <img
                  src={img.image.getDirectURL()}
                  alt={img.userName}
                  className="w-full h-full object-cover"
                  onError={e => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="p-2.5">
                <p className="text-sm font-medium text-foreground truncate">{img.userName}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    {new Date(Number(img.timestamp) / 1_000_000).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
