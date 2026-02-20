import { Music, Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useMusicPlayer } from '../hooks/useMusicPlayer';

export default function MusicControls() {
  const { isPlaying, volume, togglePlay, changeVolume } = useMusicPlayer();

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={togglePlay}
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-full hover:bg-blue-500/10"
        title={isPlaying ? 'Pause music' : 'Play music'}
      >
        {isPlaying ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5" />
        )}
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full hover:bg-blue-500/10"
            title="Volume control"
          >
            {volume === 0 ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-4" align="end">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Music className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{Math.round(volume * 100)}%</span>
            </div>
            <Slider
              value={[volume * 100]}
              onValueChange={(values) => changeVolume(values[0] / 100)}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
