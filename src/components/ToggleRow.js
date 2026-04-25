import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';
import { FeedbackSurface } from './FeedbackSurface';
import { IosToggle } from './IosToggle';

export function ToggleRow({ description, icon, label, onValueChange, tint, value }) {
  return (
    <FeedbackSurface haptic="medium" onPress={() => onValueChange(!value)} style={styles.row}>
      <View style={styles.left}>
        <View style={[styles.iconWrap, { backgroundColor: `${tint}20` }]}>
          <Ionicons name={icon} size={18} color={tint} />
        </View>
        <View>
          <Text style={styles.label}>{label}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
      </View>
      <IosToggle tint={tint} value={value} />
    </FeedbackSurface>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.label,
    color: palette.text,
    flexShrink: 1,
  },
  description: {
    ...typography.caption,
    marginTop: 3,
    color: palette.subtext,
    flexShrink: 1,
  },
});
