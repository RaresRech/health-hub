import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { palette } from '../theme/palette';

export function IosToggle({ tint, value }) {
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: value ? 1 : 0,
      speed: 20,
      bounciness: 7,
      useNativeDriver: false,
    }).start();
  }, [progress, value]);

  const trackColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.12)', tint],
  });

  const borderColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.05)', tint],
  });

  const knobTranslate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 24],
  });

  const glowOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.24],
  });

  return (
    <Animated.View style={[styles.track, { backgroundColor: trackColor, borderColor }]}>
      <Animated.View style={[styles.glow, { opacity: glowOpacity, backgroundColor: tint }]} />
      <Animated.View style={[styles.knob, { transform: [{ translateX: knobTranslate }] }]}>
        <View style={styles.knobInner} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 52,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 2,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -6,
    right: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  knob: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: palette.shadow,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  knobInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
});
