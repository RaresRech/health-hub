import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { InsightLineChart } from '../components/InsightLineChart';
import { GlassCard } from '../components/GlassCard';
import { palette } from '../theme/palette';
import { sharedStyles } from '../theme/sharedStyles';
import { typography } from '../theme/typography';
import { buildInsightFeed } from '../utils/roomData';

const graphOptions = [
  { key: 'temperature', label: 'Temperature', suffix: '\u00B0', tint: palette.rose },
  { key: 'humidity', label: 'Humidity', suffix: '%', tint: palette.cyan },
  { key: 'pressure', label: 'Pressure', suffix: ' hPa', tint: palette.blue },
  { key: 'dustDensity', label: 'Dust', suffix: ' ug/m3', tint: palette.amber },
  { key: 'detectionDistance', label: 'Distance', suffix: ' cm', tint: palette.green },
];

export function RecommendationPage({ connectionState, data, history }) {
  const tips = useMemo(() => buildInsightFeed(data), [data]);
  const [selectedGraph, setSelectedGraph] = useState(graphOptions[0].key);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse]);

  const selectedGraphConfig =
    graphOptions.find((item) => item.key === selectedGraph) ?? graphOptions[0];
  const selectedTip = tips[0];
  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });
  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.55],
  });

  const handleOpenArticle = async (url) => {
    if (!url) {
      return;
    }

    const canOpen = await Linking.canOpenURL(url);

    if (canOpen) {
      await Linking.openURL(url);
    }
  };

  return (
    <ScrollView contentContainerStyle={sharedStyles.pageContent} showsVerticalScrollIndicator={false}>
      <Text style={sharedStyles.eyebrow}>Recommendations</Text>
      <Text style={sharedStyles.pageTitle}>Ambient intelligence for the current room.</Text>

      <GlassCard style={sharedStyles.heroCard}>
        <LinearGradient
          colors={['rgba(123,197,255,0.28)', 'rgba(116,241,231,0.08)', 'rgba(255,255,255,0.04)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Animated.View
          style={[
            styles.heroOrb,
            {
              transform: [{ scale: pulseScale }],
              opacity: pulseOpacity,
              backgroundColor: `${selectedTip.tint}44`,
            },
          ]}
        />
        <View style={[styles.tipIconWrap, { backgroundColor: `${selectedTip.tint}20` }]}>
          <Ionicons name={selectedTip.icon} size={22} color={selectedTip.tint} />
        </View>
        <Text style={styles.heroTitle}>Active Tip</Text>
        <Text style={styles.heroValue}>{selectedTip.title}</Text>
        <Text style={sharedStyles.heroBody}>{selectedTip.body}</Text>
        <Text style={styles.heroMeta}>
          {connectionState === 'live' ? 'Adapting from live room data' : 'Using refined mock patterns'}
        </Text>
      </GlassCard>

      <GlassCard feedbackEnabled={false} style={styles.graphCard}>
        <View style={styles.graphHeader}>
          <View>
            <Text style={styles.sectionTitle}>Room Trends</Text>
            <Text style={styles.sectionBody}>
              Choose one parameter and watch how the room has been evolving.
            </Text>
          </View>
        </View>
        <View style={styles.graphSelectorRow}>
          {graphOptions.map((option) => {
            const active = option.key === selectedGraph;

            return (
              <Pressable
                key={option.key}
                onPress={() => setSelectedGraph(option.key)}
                style={[
                  styles.graphChip,
                  active && { backgroundColor: `${option.tint}22`, borderColor: `${option.tint}44` },
                ]}
              >
                <Text style={[styles.graphChipText, active && { color: option.tint }]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <InsightLineChart
          label={selectedGraphConfig.label}
          suffix={selectedGraphConfig.suffix}
          tint={selectedGraphConfig.tint}
          values={history[selectedGraphConfig.key] ?? []}
        />
      </GlassCard>

      {tips.map((item) => (
        <GlassCard key={item.title} style={styles.recommendationCard}>
          <View style={[sharedStyles.iconWrap, { backgroundColor: `${item.tint}22` }]}>
            <Ionicons name={item.icon} size={22} color={item.tint} />
          </View>
          <View style={styles.recommendationText}>
            <Text style={styles.recommendationTitle}>{item.title}</Text>
            <Text style={styles.recommendationBody}>{item.body}</Text>
            <Pressable
              accessibilityRole="link"
              onPress={() => handleOpenArticle(item.articleUrl)}
              style={({ pressed }) => [styles.readMoreCard, pressed && styles.readMoreCardPressed]}
            >
              <Text style={styles.readMoreTitle}>{item.articleTitle}</Text>
              <Text style={styles.readMoreBody}>{item.articleSummary}</Text>
              <View style={styles.readMoreFooter}>
                <Text style={[styles.readMoreLink, { color: item.tint }]}>Open article on the web</Text>
                <Ionicons name="arrow-forward-circle" size={18} color={item.tint} />
              </View>
            </Pressable>
          </View>
        </GlassCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heroTitle: sharedStyles.heroTitle,
  heroOrb: {
    position: 'absolute',
    top: 24,
    right: 24,
    width: 82,
    height: 82,
    borderRadius: 41,
  },
  tipIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroValue: {
    ...typography.titleLarge,
    color: '#F7F9FC',
    marginBottom: 10,
  },
  heroMeta: {
    ...typography.bodySmall,
    color: '#D7DFF0',
    marginTop: 16,
  },
  graphCard: {
    padding: 20,
  },
  graphHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    ...typography.titleMedium,
    color: '#F7F9FC',
    marginBottom: 6,
  },
  sectionBody: {
    ...typography.body,
    color: '#B2BDD1',
  },
  graphSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  graphChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  graphChipText: {
    ...typography.bodySmall,
    color: '#B2BDD1',
    fontWeight: '600',
  },
  recommendationCard: {
    flexDirection: 'row',
    gap: 14,
    padding: 18,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  recommendationText: {
    flex: 1,
    minWidth: 0,
  },
  recommendationTitle: {
    ...typography.titleSmall,
    color: '#F7F9FC',
    fontWeight: '700',
    marginBottom: 6,
  },
  recommendationBody: {
    ...typography.body,
    color: '#B2BDD1',
  },
  readMoreCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  readMoreCardPressed: {
    transform: [{ scale: 0.985 }],
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  readMoreTitle: {
    ...typography.label,
    color: '#F7F9FC',
    fontWeight: '700',
    marginBottom: 6,
  },
  readMoreBody: {
    ...typography.bodySmall,
    color: '#B2BDD1',
  },
  readMoreLink: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
  readMoreFooter: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
});
