import { useState, useEffect } from 'react';

export function useTypingEffect(text: string, speed: number = 30, delay: number = 0): string {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    // Start delay
    if (!hasStarted && delay > 0) {
      const startTimer = setTimeout(() => {
        setHasStarted(true);
      }, delay);
      return () => clearTimeout(startTimer);
    }

    if (!hasStarted && delay === 0) {
      setHasStarted(true);
    }

    // Typing effect
    if (hasStarted && currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, speed);

      return () => clearTimeout(timer);
    }
  }, [text, speed, delay, currentIndex, hasStarted]);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    setHasStarted(false);
  }, [text]);

  return displayedText;
}
