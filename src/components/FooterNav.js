import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { footerTabs } from '../constants/layout';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';
import { FeedbackSurface } from './FeedbackSurface';

export function FooterNav({ activeIndex, onPress, scrollX, width }) {
  return (
    <View style={styles.footerShell}>
      <View style={[styles.footer, { width: width - 34 }]}>
        {footerTabs.map((tab, index) => {
          const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
          const iconOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.45, 1, 0.45],
            extrapolate: 'clamp',
          });
          const iconTranslate = scrollX.interpolate({
            inputRange,
            outputRange: [8, 0, 8],
            extrapolate: 'clamp',
          });

          return (
            <FeedbackSurface
              key={tab.key}
              haptic="medium"
              onPress={() => onPress(index)}
              style={styles.footerTab}
            >
              <Animated.View style={{ opacity: iconOpacity, transform: [{ translateY: iconTranslate }] }}>
                <Ionicons
                  name={activeIndex === index ? tab.activeIcon : tab.icon}
                  size={22}
                  color={activeIndex === index ? palette.text : palette.subtext}
                />
              </Animated.View>
              <Text style={[styles.footerLabel, activeIndex === index && styles.footerLabelActive]}>
                {tab.label}
              </Text>
            </FeedbackSurface>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerShell: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(17,22,32,0.92)',
    borderRadius: 28,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: palette.border,
  },
  footerTab: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minWidth: 72,
    paddingVertical: 4,
  },
  footerLabel: {
    ...typography.labelSmall,
    color: palette.subtext,
  },
  footerLabelActive: {
    color: palette.text,
  },
});
