import { useEffect, useRef, useState } from 'react';

function easeOutCubic(value) {
  return 1 - (1 - value) ** 3;
}

export function useAnimatedNumber(value, duration = 380) {
  const [displayValue, setDisplayValue] = useState(value);
  const displayValueRef = useRef(value);

  useEffect(() => {
    const startValue = displayValueRef.current;
    const delta = value - startValue;
    const startTime = Date.now();
    let frameId = null;

    if (delta === 0) {
      setDisplayValue(value);
      return undefined;
    }

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const nextValue = startValue + delta * eased;

      displayValueRef.current = nextValue;
      setDisplayValue(nextValue);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        displayValueRef.current = value;
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [duration, value]);

  return displayValue;
}
