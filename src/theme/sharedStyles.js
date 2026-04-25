import { StyleSheet } from 'react-native';
import { palette } from './palette';
import { typography } from './typography';

export const sharedStyles = StyleSheet.create({
  pageContent: {
    paddingHorizontal: 22,
    paddingBottom: 40,
    gap: 16,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: palette.subtext,
    marginBottom: 6,
  },
  pageTitle: {
    ...typography.pageTitle,
    color: palette.text,
    marginBottom: 10,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroCard: {
    minHeight: 190,
    padding: 24,
    justifyContent: 'flex-end',
  },
  heroTitle: {
    ...typography.heroLabel,
    color: palette.subtext,
    marginBottom: 8,
  },
  heroBody: {
    ...typography.heroBody,
    color: '#C3CCDB',
    maxWidth: '88%',
  },
});
