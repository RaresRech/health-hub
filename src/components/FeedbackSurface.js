import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { triggerHaptic } from '../utils/haptics';

export function FeedbackSurface({
  children,
  disabled = false,
  haptic = 'light',
  onPress,
  style,
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (disabled) {
      scale.setValue(1);
      glow.setValue(0);
    }
  }, [disabled, glow, scale]);

  const animateTo = (toValue, glowValue, duration) => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue,
        speed: 28,
        bounciness: 5,
        useNativeDriver: true,
      }),
      Animated.timing(glow, {
        toValue: glowValue,
        duration,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressIn = () => {
    if (disabled) {
      return;
    }

    animateTo(haptic === 'medium' ? 0.97 : 0.988, 1, 120);
    triggerHaptic(haptic);
  };

  const handlePressOut = () => {
    if (disabled) {
      return;
    }

    animateTo(1, 0, 220);
  };

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
        <Animated.View pointerEvents="none" style={[styles.overlay, { opacity: glow }]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
});
