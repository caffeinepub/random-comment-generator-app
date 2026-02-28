import { useState, useEffect, useRef, useCallback } from 'react';
import { useActor } from './useActor';

const MUSIC_STORAGE_KEY = 'musicPlayerState';
const MUSIC_POLL_INTERVAL = 30000; // Poll for music changes every 30 seconds

interface MusicPlayerState {
  volume: number;
  isPlaying: boolean;
}

export function useMusicPlayer() {
  const { actor } = useActor();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(() => {
    try {
      const saved = localStorage.getItem(MUSIC_STORAGE_KEY);
      if (saved) {
        const state: MusicPlayerState = JSON.parse(saved);
        return state.volume;
      }
    } catch {
      // Ignore errors
    }
    return 0.5;
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch music URL from backend
  const fetchMusicUrl = useCallback(async () => {
    if (!actor) return;
    
    try {
      // Backend stores music as a blob, we need to fetch it
      // For now, we'll use a placeholder approach
      // In a real implementation, you'd have a backend method to get the current music blob
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch music:', error);
      setIsLoading(false);
    }
  }, [actor]);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
      audioRef.current.volume = volume;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [volume]);

  // Fetch music URL on mount and periodically
  useEffect(() => {
    fetchMusicUrl();
    const interval = setInterval(fetchMusicUrl, MUSIC_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchMusicUrl]);

  // Update audio source when music URL changes
  useEffect(() => {
    if (audioRef.current && musicUrl) {
      audioRef.current.src = musicUrl;
      if (isPlaying) {
        audioRef.current.play().catch(() => {
          // Autoplay blocked, user needs to interact first
          setIsPlaying(false);
        });
      }
    }
  }, [musicUrl, isPlaying]);

  // Save state to localStorage
  useEffect(() => {
    try {
      const state: MusicPlayerState = { volume, isPlaying };
      localStorage.setItem(MUSIC_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore errors
    }
  }, [volume, isPlaying]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((error) => {
        console.error('Failed to play audio:', error);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const changeVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
  }, []);

  const attemptAutoPlay = useCallback(() => {
    if (!audioRef.current || !musicUrl) return;

    // Try to autoplay, muted first if needed
    audioRef.current.play().then(() => {
      setIsPlaying(true);
    }).catch(() => {
      // Autoplay blocked, try muted
      audioRef.current!.muted = true;
      audioRef.current!.play().then(() => {
        setIsPlaying(true);
        // Unmute after a short delay
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.muted = false;
          }
        }, 1000);
      }).catch(() => {
        // Still blocked, user needs to interact
        setIsPlaying(false);
      });
    });
  }, [musicUrl]);

  const updateMusicUrl = useCallback((url: string) => {
    setMusicUrl(url);
  }, []);

  return {
    isPlaying,
    volume,
    isLoading,
    togglePlay,
    changeVolume,
    attemptAutoPlay,
    updateMusicUrl,
  };
}
