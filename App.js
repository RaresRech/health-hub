import 'react-native-get-random-values';
import { Buffer } from 'buffer';
import process from 'process';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StatusBar, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { footerTabs } from './src/constants/layout';
import { palette } from './src/theme/palette';
import { typography } from './src/theme/typography';
import { useRoomFeed } from './src/hooks/useRoomFeed';
import { FooterNav } from './src/components/FooterNav';
import { RecommendationPage } from './src/screens/RecommendationPage';
import { SettingsPage } from './src/screens/SettingsPage';
import { StatsPage } from './src/screens/StatsPage';

global.Buffer = global.Buffer || Buffer;
global.process = global.process || process;

export default function App() {
  const { width } = useWindowDimensions();
  const scrollX = useRef(new Animated.Value(width)).current;
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(1);
  const initialPageAligned = useRef(false);
  const welcomeOpacity = useRef(new Animated.Value(1)).current;
  const welcomeScale = useRef(new Animated.Value(1)).current;
  const welcomeTranslate = useRef(new Animated.Value(0)).current;
  const [showWelcome, setShowWelcome] = useState(true);
  const {
    brokerConfig,
    connectionState,
    data,
    history,
    mqttDebug,
    setBrokerConfig,
    updateControl,
    updateMeta,
    updateNeoPixel,
    updateTargetTemperature,
  } = useRoomFeed();

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.delay(450),
      Animated.parallel([
        Animated.timing(welcomeOpacity, {
          toValue: 0,
          duration: 950,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(welcomeScale, {
          toValue: 1.06,
          duration: 950,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(welcomeTranslate, {
          toValue: -24,
          duration: 950,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]);

    animation.start(({ finished }) => {
      if (finished) {
        setShowWelcome(false);
      }
    });

    return () => animation.stop();
  }, [welcomeOpacity, welcomeScale, welcomeTranslate]);

  useEffect(() => {
    scrollX.setValue(activeIndex * width);

    if (!initialPageAligned.current && scrollRef.current && width > 0) {
      scrollRef.current.scrollTo({ x: activeIndex * width, animated: false });
      initialPageAligned.current = true;
    }
  }, [activeIndex, scrollX, width]);

  const pages = [
    <RecommendationPage
      key="recommendations"
      connectionState={connectionState}
      data={data}
      history={history}
    />,
    <StatsPage
      key="stats"
      connectionState={connectionState}
      data={data}
      updateControl={updateControl}
      updateMeta={updateMeta}
      updateNeoPixel={updateNeoPixel}
      updateTargetTemperature={updateTargetTemperature}
      width={width}
    />,
    <SettingsPage
      key="settings"
      brokerConfig={brokerConfig}
      connectionState={connectionState}
      data={data}
      mqttDebug={mqttDebug}
      onConfigChange={(field, value) =>
        setBrokerConfig((current) => {
          if (field === 'hostIp') {
            return {
              ...current,
              hostIp: value,
              url: `ws://${value}:${current.port || '1883'}`,
            };
          }

          if (field === 'port') {
            return {
              ...current,
              port: value,
              url: `ws://${current.hostIp}:${value}`,
            };
          }

          return { ...current, [field]: value };
        })
      }
      updateControl={updateControl}
      updateMeta={updateMeta}
      updateTargetTemperature={updateTargetTemperature}
    />,
  ];

  const handleFooterPress = (index) => {
    setActiveIndex(index);
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#08111F', '#06090F', '#040507']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.ambientOrbTop} />
      <View style={styles.ambientOrbBottom} />

      <Animated.ScrollView
        ref={scrollRef}
        contentOffset={{ x: width, y: 0 }}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) => {
          const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
          setActiveIndex(nextIndex);
        }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
      >
        {pages.map((page, index) => (
          <View key={footerTabs[index].key} style={[styles.page, { width }]}>
            {page}
          </View>
        ))}
      </Animated.ScrollView>

      <FooterNav
        activeIndex={activeIndex}
        scrollX={scrollX}
        width={width}
        onPress={handleFooterPress}
      />

      {showWelcome ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.welcomeOverlay,
            {
              opacity: welcomeOpacity,
              transform: [{ translateY: welcomeTranslate }, { scale: welcomeScale }],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(8,17,31,0.96)', 'rgba(8,17,31,0.88)', 'rgba(4,5,7,0.98)']}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.welcomeHalo} />
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeEyebrow}>Smart Hub</Text>
            <Text style={styles.welcomeTitle}>Welcome</Text>
            <Text style={styles.welcomeBody}>Room intelligence, refined.</Text>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  ambientOrbTop: {
    position: 'absolute',
    top: -120,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(123,197,255,0.16)',
  },
  ambientOrbBottom: {
    position: 'absolute',
    bottom: 120,
    left: -90,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255,139,166,0.12)',
  },
  page: {
    paddingTop: 72,
    paddingBottom: 118,
  },
  welcomeOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeHalo: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(123,197,255,0.12)',
  },
  welcomeContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  welcomeEyebrow: {
    ...typography.eyebrow,
    color: 'rgba(226,234,247,0.74)',
    letterSpacing: 2.8,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  welcomeTitle: {
    ...typography.displayMedium,
    color: '#F8FBFF',
  },
  welcomeBody: {
    ...typography.label,
    marginTop: 12,
    color: 'rgba(226,234,247,0.82)',
    letterSpacing: 0.2,
  },
});
