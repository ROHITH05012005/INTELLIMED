import { useState, useEffect } from 'react';
import { differenceInSeconds, parseISO } from 'date-fns';

/**
 * useCountdown — returns seconds remaining until a target ISO datetime string.
 * Updates every second. Returns null if target is in the past.
 */
export function useCountdown(targetISO: string | undefined): number | null {
  const [seconds, setSeconds] = useState<number | null>(() => {
    if (!targetISO) return null;
    const diff = differenceInSeconds(parseISO(targetISO), new Date());
    return diff > 0 ? diff : null;
  });

  useEffect(() => {
    if (!targetISO) {
      setSeconds(null);
      return;
    }

    const update = () => {
      const diff = differenceInSeconds(parseISO(targetISO), new Date());
      setSeconds(diff > 0 ? diff : null);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetISO]);

  return seconds;
}
