import { useEffect, useRef } from 'react';

export function useSwipeNav(onPrev: () => void, onNext: () => void, enabled: boolean) {
  const startX = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    function onTouchStart(e: TouchEvent) {
      startX.current = e.touches[0]?.clientX ?? null;
    }

    function onTouchEnd(e: TouchEvent) {
      if (startX.current == null) return;
      const endX = e.changedTouches[0]?.clientX ?? startX.current;
      const delta = endX - startX.current;
      startX.current = null;
      if (Math.abs(delta) < 80) return;
      if (delta > 0) onPrev();
      else onNext();
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [enabled, onPrev, onNext]);
}
