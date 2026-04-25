import { StyleSheet, View } from 'react-native';
import { palette } from '../theme/palette';
import { FeedbackSurface } from './FeedbackSurface';

export function GlassCard({ children, feedbackEnabled = true, haptic = 'light', onPress, style }) {
  if (!feedbackEnabled) {
    return <View style={[styles.card, style]}>{children}</View>;
  }

  return (
    <FeedbackSurface haptic={haptic} onPress={onPress || (() => {})} style={[styles.card, style]}>
      {children}
    </FeedbackSurface>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    backgroundColor: 'rgba(20,27,41,0.86)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
    shadowColor: palette.shadow,
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12,
  },
});
