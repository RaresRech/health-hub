import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, LayoutAnimation, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, UIManager, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { FeedbackSurface } from '../components/FeedbackSurface';
import { GlassCard } from '../components/GlassCard';
import { statKeyToUiPage, uiPages } from '../constants/uiPages';
import { statCards } from '../data/statDefinitions';
import { palette } from '../theme/palette';
import { sharedStyles } from '../theme/sharedStyles';
import { typography } from '../theme/typography';
import {
  buildAirQualityAssessment,
  buildPrimaryInsight,
  formatStatValue,
} from '../utils/roomData';
import { IosToggle } from '../components/IosToggle';

const neoPixelBehaviors = ['Automatic', 'Predefined Color', 'Custom Color'];
const neoPixelPresets = [
  { name: 'Orange', color: '#FF9B45' },
  { name: 'Blue', color: '#2F6BFF' },
  { name: 'Warm White', color: '#FFF2D0' },
  { name: 'Green', color: '#36D982' },
  { name: 'Purple', color: '#9B5CFF' },
  { name: 'Dust Gold', color: '#B8943D' },
];
const brightnessSteps = [0.05, 0.25, 0.5, 0.75, 1];

function clampChannel(value) {
  return Math.min(255, Math.max(0, Math.round(value)));
}

function rgbToHex(red, green, blue) {
  return `#${[red, green, blue]
    .map((channel) => clampChannel(channel).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

function getPresetColor(name) {
  return neoPixelPresets.find((preset) => preset.name === name)?.color ?? neoPixelPresets[0].color;
}

function getNeoPixelPreviewColor(controls) {
  if (controls.neoPixelBehavior === 'Custom Color') {
    return rgbToHex(
      controls.neoPixelCustomRed,
      controls.neoPixelCustomGreen,
      controls.neoPixelCustomBlue,
    );
  }

  if (controls.neoPixelBehavior === 'Predefined Color') {
    return getPresetColor(controls.neoPixelPredefinedColor);
  }

  return palette.cyan;
}

function QuickControl({ icon, label, onPress, tint, value }) {
  return (
    <FeedbackSurface haptic="medium" onPress={onPress} style={styles.quickControl}>
      <View style={[styles.quickControlIcon, { backgroundColor: `${tint}24` }]}>
        <Ionicons color={tint} name={icon} size={18} />
      </View>
      <Text style={styles.quickControlLabel}>{label}</Text>
      <IosToggle tint={tint} value={value} />
    </FeedbackSurface>
  );
}

function NeoPixelPowerSwitch({ color, onPress, value }) {
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: value ? 1 : 0,
      speed: 18,
      bounciness: 8,
      useNativeDriver: false,
    }).start();
  }, [progress, value]);

  const glowScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.88, 1],
  });

  const orbTranslate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 132],
  });

  const trackBorder = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.08)', color],
  });

  return (
    <FeedbackSurface haptic="medium" onPress={onPress} style={styles.neoPowerTrack}>
      <Animated.View
        style={[
          styles.neoPowerGlow,
          { backgroundColor: color, transform: [{ scale: glowScale }] },
        ]}
      />
      <Animated.View style={[styles.neoPowerOrb, { transform: [{ translateX: orbTranslate }] }]}>
        <LinearGradient
          colors={[`${color}FF`, `${color}CC`, '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.neoPowerOrbGradient}
        >
          <Ionicons color="#051017" name={value ? 'sparkles' : 'power'} size={20} />
        </LinearGradient>
      </Animated.View>
      <Animated.View style={[styles.neoPowerLabels, { borderColor: trackBorder }]}>
        <Text style={[styles.neoPowerLabel, !value && styles.neoPowerLabelActive]}>Sleep</Text>
        <Text style={[styles.neoPowerLabel, value && { color } ]}>Glow</Text>
      </Animated.View>
    </FeedbackSurface>
  );
}

function ChannelStepper({ color, label, onChange, value }) {
  return (
    <View style={styles.channelRow}>
      <View style={styles.channelLabelWrap}>
        <View style={[styles.channelDot, { backgroundColor: color }]} />
        <Text style={styles.channelLabel}>{label}</Text>
      </View>
      <View style={styles.channelControls}>
        <FeedbackSurface
          haptic="soft"
          onPress={() => onChange(clampChannel(value - 15))}
          style={styles.channelButton}
        >
          <Ionicons color={palette.text} name="remove" size={16} />
        </FeedbackSurface>
        <Text style={styles.channelValue}>{value}</Text>
        <FeedbackSurface
          haptic="soft"
          onPress={() => onChange(clampChannel(value + 15))}
          style={styles.channelButton}
        >
          <Ionicons color={palette.text} name="add" size={16} />
        </FeedbackSurface>
      </View>
    </View>
  );
}

function NeoPixelModal({
  behavior,
  brightness,
  customBlue,
  customGreen,
  customRed,
  onClose,
  onUpdate,
  predefinedColor,
  previewColor,
  visible,
}) {
  const intro = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      intro.setValue(0);
      return;
    }

    Animated.timing(intro, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [intro, visible]);

  const cardTranslate = intro.interpolate({
    inputRange: [0, 1],
    outputRange: [36, 0],
  });

  const cardOpacity = intro.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.modalRoot}>
        <Pressable onPress={onClose} style={styles.modalBackdrop} />
        <Animated.View
          style={[
            styles.modalCard,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardTranslate }],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(116,241,231,0.16)', 'rgba(123,197,255,0.08)', 'rgba(255,255,255,0.03)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalEyebrow}>NeoPixel Ring</Text>
              <Text style={styles.modalTitle}>Create a signature glow scene.</Text>
            </View>
            <FeedbackSurface haptic="soft" onPress={onClose} style={styles.modalClose}>
              <Ionicons color={palette.text} name="close" size={18} />
            </FeedbackSurface>
          </View>

          <View style={styles.neoPreviewWrap}>
            <View style={[styles.neoPreviewHalo, { backgroundColor: `${previewColor}28`, opacity: brightness }]} />
            <View style={[styles.neoPreviewRing, { borderColor: `${previewColor}D9` }]}>
              <View style={[styles.neoPreviewCore, { backgroundColor: `${previewColor}22` }]}>
                <Text style={styles.neoPreviewText}>{behavior}</Text>
              </View>
            </View>
          </View>

          <View style={styles.neoSection}>
            <Text style={styles.neoSectionLabel}>Behavior</Text>
            <View style={styles.neoSegmentRow}>
              {neoPixelBehaviors.map((option) => {
                const active = option === behavior;

                return (
                  <Pressable
                    key={option}
                    onPress={() => onUpdate({ neoPixelBehavior: option })}
                    style={[
                      styles.neoSegment,
                      active && { backgroundColor: `${previewColor}22`, borderColor: `${previewColor}66` },
                    ]}
                  >
                    <Text style={[styles.neoSegmentText, active && { color: previewColor }]}>
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.neoSection}>
            <Text style={styles.neoSectionLabel}>Predefined Color</Text>
            <View style={styles.neoColorRow}>
              {neoPixelPresets.map((preset) => {
                const active = predefinedColor === preset.name;

                return (
                <FeedbackSurface
                  key={preset.name}
                  haptic="soft"
                  onPress={() =>
                    onUpdate({
                      neoPixelBehavior: 'Predefined Color',
                      neoPixelPredefinedColor: preset.name,
                    })
                  }
                  style={[
                    styles.neoColorChip,
                    active && styles.neoColorChipActive,
                  ]}
                >
                  <LinearGradient
                    colors={[preset.color, `${preset.color}99`]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.neoColorFill}
                  />
                  <Text style={styles.neoColorName}>{preset.name}</Text>
                </FeedbackSurface>
                );
              })}
            </View>
          </View>

          <View style={styles.neoSection}>
            <Text style={styles.neoSectionLabel}>Custom Color</Text>
            <ChannelStepper
              color="#FF5E76"
              label="Red"
              onChange={(value) =>
                onUpdate({ neoPixelBehavior: 'Custom Color', neoPixelCustomRed: value })
              }
              value={customRed}
            />
            <ChannelStepper
              color="#36D982"
              label="Green"
              onChange={(value) =>
                onUpdate({ neoPixelBehavior: 'Custom Color', neoPixelCustomGreen: value })
              }
              value={customGreen}
            />
            <ChannelStepper
              color="#4D8DFF"
              label="Blue"
              onChange={(value) =>
                onUpdate({ neoPixelBehavior: 'Custom Color', neoPixelCustomBlue: value })
              }
              value={customBlue}
            />
          </View>

          <View style={styles.neoSection}>
            <View style={styles.brightnessHeader}>
              <Text style={styles.neoSectionLabel}>Custom Brightness</Text>
              <Text style={styles.brightnessValue}>{brightness.toFixed(2)}</Text>
            </View>
            <View style={styles.brightnessSteps}>
              {brightnessSteps.map((step) => {
                const active = brightness >= step;
                return (
                  <FeedbackSurface
                    key={step}
                    haptic="soft"
                    onPress={() => onUpdate({ neoPixelCustomBrightness: step })}
                    style={[styles.brightnessStep, active && styles.brightnessStepActive]}
                  >
                    <LinearGradient
                      colors={active ? [`${previewColor}E6`, `${previewColor}99`] : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.03)']}
                      start={{ x: 0, y: 1 }}
                      end={{ x: 0, y: 0 }}
                      style={[styles.brightnessStepFill, { height: 14 + step * 44 }]}
                    />
                    <Text style={styles.brightnessStepText}>{step}</Text>
                  </FeedbackSurface>
                );
              })}
            </View>
          </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function NeoPixelQuickControl({ behavior, brightness, color, onPress, preset }) {
  return (
    <FeedbackSurface haptic="medium" onPress={onPress} style={styles.neoQuickControl}>
      <LinearGradient
        colors={[`${color}22`, 'rgba(255,255,255,0.03)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.neoQuickLeft}>
        <View style={[styles.neoQuickOrb, { backgroundColor: `${color}55` }]}>
          <Ionicons color={color} name="color-palette-outline" size={18} />
        </View>
        <View>
          <Text style={styles.quickControlLabel}>NeoPixel</Text>
          <Text style={styles.neoQuickText}>
            {behavior} {'\u2022'} {preset} {'\u2022'} {brightness.toFixed(2)}
          </Text>
        </View>
      </View>
      <Ionicons color={palette.subtext} name="chevron-forward" size={18} />
    </FeedbackSurface>
  );
}

export function StatsPage({
  connectionState,
  data,
  updateControl,
  updateMeta,
  updateNeoPixel,
  updateTargetTemperature,
  width,
}) {
  const [controlsExpanded, setControlsExpanded] = useState(false);
  const [neoPixelOpen, setNeoPixelOpen] = useState(false);
  const expandProgress = useRef(new Animated.Value(0)).current;
  const airQuality = buildAirQualityAssessment(data);
  const mainInsight = buildPrimaryInsight(data);
  const activeUiPage = String(data.meta.uiPage);
  const neoPixelPreviewColor = getNeoPixelPreviewColor(data.controls);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    Animated.timing(expandProgress, {
      toValue: controlsExpanded ? 1 : 0,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [controlsExpanded, expandProgress]);

  const toggleControls = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setControlsExpanded((current) => !current);
  };

  const expandedOpacity = expandProgress.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0, 0.2, 1],
  });

  const expandedTranslate = expandProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-12, 0],
  });

  const chevronRotate = expandProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const setUiPage = (page) => {
    updateMeta('uiPage', page);
  };

  const updateTargetTemperatureWithPage = (value) => {
    setUiPage(uiPages.thermostat);
    updateTargetTemperature(value);
  };

  return (
    <ScrollView contentContainerStyle={sharedStyles.pageContent} showsVerticalScrollIndicator={false}>
      <Text style={sharedStyles.eyebrow}>Vitals</Text>
      <Text style={sharedStyles.pageTitle}>A calm, glanceable picture of the room.</Text>

      <GlassCard
        onPress={() => setUiPage(uiPages.currentTemp)}
        style={[
          sharedStyles.heroCard,
          activeUiPage === uiPages.currentTemp && styles.activeHeroCard,
        ]}
      >
        <LinearGradient
          colors={['rgba(255,139,166,0.28)', 'rgba(123,197,255,0.12)', 'rgba(255,255,255,0.04)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Text style={sharedStyles.heroTitle}>Current Temperature</Text>
        <View style={styles.heroTopRow}>
          <AnimatedNumber
            decimals={1}
            style={styles.temperatureValue}
            suffix={'\u00B0'}
            value={data.temperature}
          />
          <View style={styles.heroDivider} />
          <View style={styles.heroAirQualityPanel}>
            <Text style={styles.heroAirQualityLabel}>Air Quality</Text>
            <View style={styles.heroAirQualityValueRow}>
              <AnimatedNumber
                decimals={0}
                style={[styles.heroAirQualityScore, { color: airQuality.tint }]}
                value={airQuality.score}
              />
              <Text style={styles.heroAirQualityOutOf}>/10</Text>
            </View>
            <Text style={[styles.heroAirQualityStatus, { color: airQuality.tint }]}>
              {airQuality.label}
            </Text>
          </View>
        </View>
        <View style={styles.heroMetaRow}>
          <Text style={styles.heroMeta}>
            Target <AnimatedNumber decimals={0} style={styles.heroMeta} suffix={'\u00B0'} value={data.targetTemperature} />
          </Text>
          <Text style={styles.heroMeta}>
            {connectionState === 'live'
              ? 'Live MQTT data'
              : connectionState === 'connected'
                ? 'Waiting for state messages'
                : 'Mock fallback enabled'}
          </Text>
        </View>
      </GlassCard>

      <View style={styles.featureRow}>
        <GlassCard
          onPress={() => setUiPage(uiPages.currentTemp)}
          style={[
            styles.insightCard,
            activeUiPage === uiPages.currentTemp && styles.activeInsightCard,
          ]}
        >
          <View style={[styles.insightIconWrap, { backgroundColor: `${mainInsight.tint}20` }]}>
            <Ionicons color={mainInsight.tint} name={mainInsight.icon} size={20} />
          </View>
          <Text style={styles.sectionEyebrow}>General Insight</Text>
          <Text style={styles.insightTitle}>{mainInsight.title}</Text>
          <Text style={styles.insightBody}>{mainInsight.body}</Text>
          {activeUiPage === uiPages.currentTemp ? (
            <View style={styles.activePageBadge}>
              <Text style={styles.activePageBadgeText}>Device Focus</Text>
            </View>
          ) : null}
        </GlassCard>
      </View>

      <GlassCard feedbackEnabled={false} style={styles.controlsCard}>
        <FeedbackSurface haptic="medium" onPress={toggleControls} style={styles.controlsSummary}>
          <View style={styles.controlsSummaryLeft}>
            <View style={styles.controlsSummaryIcon}>
              <Ionicons color={palette.cyan} name="options-outline" size={18} />
            </View>
            <View>
              <Text style={styles.controlsTitle}>Quick Controls</Text>
              <Text style={styles.controlsSummaryText}>
                {data.controls.heating ? 'Heating on' : 'Heating off'} {'\u2022'}{' '}
                {data.controls.light ? 'Light on' : 'Light off'} {'\u2022'} Target {data.targetTemperature}{'\u00B0'}C
              </Text>
            </View>
          </View>
          <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
            <Ionicons color={palette.subtext} name="chevron-down" size={20} />
          </Animated.View>
        </FeedbackSurface>

        {controlsExpanded ? (
          <Animated.View
            style={[
              styles.controlsExpanded,
              {
                opacity: expandedOpacity,
                transform: [{ translateY: expandedTranslate }],
              },
            ]}
          >
            <View style={styles.quickControlsGrid}>
              <QuickControl
                icon="flame-outline"
                label="Heating"
                onPress={() => {
                  setUiPage(uiPages.thermostat);
                  updateControl('heating', !data.controls.heating);
                }}
                tint={palette.rose}
                value={data.controls.heating}
              />
              <QuickControl
                icon="bulb-outline"
                label="Light"
                onPress={() => {
                  setUiPage(uiPages.light);
                  updateControl('light', !data.controls.light);
                }}
                tint={palette.amber}
                value={data.controls.light}
              />
              <NeoPixelQuickControl
                behavior={data.controls.neoPixelBehavior}
                brightness={data.controls.neoPixelCustomBrightness}
                color={neoPixelPreviewColor}
                onPress={() => setNeoPixelOpen(true)}
                preset={data.controls.neoPixelPredefinedColor}
              />
            </View>
            <View style={styles.targetRail}>
              <Text style={styles.targetRailLabel}>Target Temperature</Text>
              <View style={styles.targetRailActions}>
                <FeedbackSurface
                  haptic="medium"
                  onPress={() =>
                    updateTargetTemperatureWithPage(Math.max(16, data.targetTemperature - 1))
                  }
                  style={styles.targetRailButton}
                >
                  <Ionicons color={palette.text} name="remove" size={18} />
                </FeedbackSurface>
                <AnimatedNumber decimals={0} style={styles.targetRailValue} suffix={'\u00B0C'} value={data.targetTemperature} />
                <FeedbackSurface
                  haptic="medium"
                  onPress={() =>
                    updateTargetTemperatureWithPage(Math.min(30, data.targetTemperature + 1))
                  }
                  style={styles.targetRailButton}
                >
                  <Ionicons color={palette.text} name="add" size={18} />
                </FeedbackSurface>
              </View>
            </View>
          </Animated.View>
        ) : null}
      </GlassCard>

      <NeoPixelModal
        behavior={data.controls.neoPixelBehavior}
        brightness={data.controls.neoPixelCustomBrightness}
        customBlue={data.controls.neoPixelCustomBlue}
        customGreen={data.controls.neoPixelCustomGreen}
        customRed={data.controls.neoPixelCustomRed}
        onClose={() => setNeoPixelOpen(false)}
        onUpdate={updateNeoPixel}
        predefinedColor={data.controls.neoPixelPredefinedColor}
        previewColor={neoPixelPreviewColor}
        visible={neoPixelOpen}
      />

      <View style={styles.grid}>
        {statCards.map((stat) => (
          <GlassCard
            key={stat.key}
            onPress={() => {
              const page = statKeyToUiPage[stat.key];
              if (page) {
                setUiPage(page);
              }
            }}
            style={[
              styles.statCard,
              { width: (width - 58) / 2 },
              statKeyToUiPage[stat.key] === activeUiPage && styles.activeStatCard,
            ]}
          >
            {statKeyToUiPage[stat.key] === activeUiPage ? (
              <View style={styles.activeStatGlow} />
            ) : null}
            <View style={[sharedStyles.iconWrap, { backgroundColor: `${stat.tint}20` }]}>
              <Ionicons name={stat.icon} size={18} color={stat.tint} />
            </View>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <View style={styles.statValueRow}>
              {typeof data[stat.key] === 'number' ? (
                <AnimatedNumber decimals={stat.decimals ?? 0} style={styles.statValue} value={data[stat.key]} />
              ) : (
                <Text style={styles.statValue}>{formatStatValue(stat.key, data[stat.key])}</Text>
              )}
              {stat.unit ? <Text style={styles.statUnit}> {stat.unit}</Text> : null}
            </View>
            {stat.key === 'presence' ? (
              <Text style={styles.statSubValue}>
                Distance {Number.isFinite(data.detectionDistance) ? `${data.detectionDistance.toFixed(0)} cm` : 'N/A'}
              </Text>
            ) : null}
          </GlassCard>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  temperatureValue: {
    ...typography.displayLarge,
    color: palette.text,
  },
  activeHeroCard: {
    borderColor: 'rgba(123,197,255,0.26)',
    backgroundColor: 'rgba(18,27,40,0.96)',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  heroDivider: {
    width: 1,
    minHeight: 72,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 14,
    marginVertical: 4,
  },
  heroMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  heroMeta: {
    ...typography.bodySmall,
    color: '#D7DFF0',
    flexShrink: 1,
  },
  heroAirQualityPanel: {
    flex: 1,
    minWidth: 112,
    justifyContent: 'center',
  },
  heroAirQualityLabel: {
    ...typography.caption,
    color: palette.subtext,
    marginBottom: 6,
  },
  heroAirQualityValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: 4,
  },
  heroAirQualityScore: {
    ...typography.metric,
  },
  heroAirQualityOutOf: {
    ...typography.label,
    color: palette.subtext,
    marginBottom: 4,
  },
  heroAirQualityStatus: {
    ...typography.bodySmall,
    fontWeight: '700',
    marginTop: 4,
  },
  featureRow: {
    gap: 14,
  },
  insightCard: {
    padding: 20,
    minHeight: 168,
  },
  activeInsightCard: {
    borderColor: 'rgba(123,197,255,0.24)',
    backgroundColor: 'rgba(22,31,45,0.98)',
  },
  sectionEyebrow: {
    ...typography.bodySmall,
    color: palette.subtext,
    marginBottom: 10,
  },
  insightIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  insightTitle: {
    ...typography.titleMedium,
    color: palette.text,
    marginBottom: 8,
  },
  insightBody: {
    ...typography.body,
    color: '#D7DFF0',
  },
  activePageBadge: {
    alignSelf: 'flex-start',
    marginTop: 16,
    backgroundColor: 'rgba(123,197,255,0.16)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  activePageBadgeText: {
    ...typography.labelSmall,
    color: palette.blue,
    fontWeight: '700',
  },
  controlsCard: {
    padding: 20,
  },
  controlsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    minHeight: 50,
  },
  controlsSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 12,
  },
  controlsSummaryIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(116,241,231,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  controlsTitle: {
    ...typography.titleSmall,
    color: palette.text,
    flexShrink: 1,
  },
  controlsSummaryText: {
    ...typography.caption,
    color: palette.subtext,
    marginTop: 4,
    flexShrink: 1,
  },
  controlsExpanded: {
    marginTop: 16,
  },
  quickControlsGrid: {
    gap: 12,
  },
  quickControl: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: palette.border,
  },
  neoQuickControl: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
  },
  neoQuickLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 12,
  },
  neoQuickOrb: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  neoQuickText: {
    ...typography.caption,
    color: palette.subtext,
    marginTop: 3,
    flexShrink: 1,
  },
  quickControlIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickControlLabel: {
    ...typography.label,
    flex: 1,
    color: palette.text,
    marginLeft: 12,
    flexShrink: 1,
  },
  targetRail: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  targetRailLabel: {
    ...typography.bodySmall,
    color: palette.subtext,
    marginBottom: 12,
  },
  targetRailActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  targetRailButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: palette.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetRailValue: {
    ...typography.titleLarge,
    color: palette.text,
    flexShrink: 1,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    position: 'relative',
    backgroundColor: 'rgba(16,22,34,0.96)',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 34,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
    maxHeight: '92%',
  },
  modalScrollContent: {
    paddingBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 22,
  },
  modalEyebrow: {
    ...typography.bodySmall,
    color: palette.subtext,
    marginBottom: 6,
  },
  modalTitle: {
    ...typography.titleLarge,
    color: palette.text,
    maxWidth: '84%',
    flexShrink: 1,
  },
  modalClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  neoPreviewWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    paddingVertical: 12,
  },
  neoPreviewHalo: {
    position: 'absolute',
    width: 184,
    height: 184,
    borderRadius: 92,
  },
  neoPreviewRing: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  neoPreviewCore: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
  },
  neoPreviewText: {
    ...typography.labelSmall,
    color: palette.text,
    textAlign: 'center',
    maxWidth: 72,
  },
  neoPowerTrack: {
    position: 'relative',
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 24,
  },
  neoPowerGlow: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: 10,
    bottom: 10,
    borderRadius: 28,
    opacity: 0.14,
  },
  neoPowerOrb: {
    position: 'absolute',
    left: 10,
    top: 10,
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
  },
  neoPowerOrbGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  neoPowerLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
    borderRadius: 36,
    borderWidth: 1,
    paddingHorizontal: 22,
  },
  neoPowerLabel: {
    ...typography.label,
    color: palette.subtext,
    flexShrink: 1,
  },
  neoPowerLabelActive: {
    color: palette.text,
  },
  neoSection: {
    marginBottom: 22,
  },
  neoSectionLabel: {
    ...typography.label,
    color: palette.text,
    marginBottom: 14,
  },
  neoSegmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  neoSegment: {
    minHeight: 40,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  neoSegmentText: {
    ...typography.bodySmall,
    color: palette.subtext,
    fontWeight: '700',
  },
  neoColorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  neoColorChip: {
    width: 92,
    minHeight: 74,
    borderRadius: 18,
    padding: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  neoColorChipActive: {
    borderColor: 'rgba(255,255,255,0.28)',
  },
  neoColorFill: {
    height: 28,
    borderRadius: 14,
    marginBottom: 8,
  },
  neoColorName: {
    ...typography.labelSmall,
    color: palette.text,
    textAlign: 'center',
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  channelLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  channelDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  channelLabel: {
    ...typography.body,
    color: palette.text,
  },
  channelControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  channelButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelValue: {
    ...typography.label,
    color: palette.text,
    width: 34,
    textAlign: 'center',
  },
  brightnessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  brightnessValue: {
    ...typography.body,
    color: palette.subtext,
    fontWeight: '600',
  },
  brightnessSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  brightnessStep: {
    width: 54,
    height: 86,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 8,
  },
  brightnessStepActive: {
    borderColor: 'rgba(255,255,255,0.12)',
  },
  brightnessStepFill: {
    width: 24,
    borderRadius: 12,
  },
  brightnessStepText: {
    ...typography.labelSmall,
    color: palette.subtext,
    marginTop: 5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  statCard: {
    position: 'relative',
    padding: 18,
    minHeight: 132,
    justifyContent: 'space-between',
  },
  activeStatCard: {
    borderColor: 'rgba(123,197,255,0.24)',
    backgroundColor: 'rgba(22,31,45,0.98)',
  },
  activeStatGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: palette.blue,
  },
  statLabel: {
    ...typography.body,
    color: palette.subtext,
    marginBottom: 6,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  statValue: {
    ...typography.titleMedium,
    color: palette.text,
    fontSize: 24,
  },
  statUnit: {
    ...typography.label,
    color: palette.subtext,
    fontWeight: '500',
    marginBottom: 3,
  },
  statSubValue: {
    ...typography.caption,
    color: palette.subtext,
    marginTop: 6,
  },
});
