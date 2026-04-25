import { mockRoomStats } from '../data/mockRoomStats';
import { palette } from '../theme/palette';

const pm25Breakpoints = [
  { cLow: 0.0, cHigh: 9.0, iLow: 0, iHigh: 50 },
  { cLow: 9.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
  { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
  { cLow: 55.5, cHigh: 125.4, iLow: 151, iHigh: 200 },
  { cLow: 125.5, cHigh: 225.4, iLow: 201, iHigh: 300 },
  { cLow: 225.5, cHigh: 325.4, iLow: 301, iHigh: 500 },
];

function clampNumber(value, min, max, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, numeric));
}

function normalizeBrightness(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return clampNumber(numeric > 1 ? numeric / 100 : numeric, 0.05, 1, fallback);
}

export function normalizePayload(raw) {
  const payload = raw?.room ?? raw ?? {};
  const controls = payload.controls ?? raw?.controls ?? {};
  const meta = payload.meta ?? raw?.meta ?? {};

  return {
    dustDensity: Number(payload.dustDensity ?? payload.dust ?? mockRoomStats.dustDensity),
    presence: Boolean(payload.presence ?? payload.personPresence ?? mockRoomStats.presence),
    pressure: Number(payload.pressure ?? payload.pres ?? mockRoomStats.pressure),
    temperature: Number(payload.temperature ?? payload.temp ?? mockRoomStats.temperature),
    humidity: Number(payload.humidity ?? payload.hum ?? mockRoomStats.humidity),
    detectionDistance: Number(
      payload.detectionDistance ??
        payload.detection_distance ??
        payload.distance ??
        payload.detectDistance ??
        mockRoomStats.detectionDistance,
    ),
    gasPresence: Boolean(payload.gasPresence ?? payload.gas ?? mockRoomStats.gasPresence),
    targetTemperature: Number(
      payload.targetTemperature ??
        controls.targetTemperature ??
        mockRoomStats.targetTemperature,
    ),
    controls: {
      heating: Boolean(controls.heating ?? controls.heatingOn ?? mockRoomStats.controls.heating),
      light: Boolean(controls.light ?? mockRoomStats.controls.light),
      neoPixelBehavior: String(
        controls.neoPixelBehavior ??
          controls.neopixelBehavior ??
          controls.neopixel_behavior ??
          mockRoomStats.controls.neoPixelBehavior,
      ),
      neoPixelPredefinedColor: String(
        controls.neoPixelPredefinedColor ??
          controls.neopixelPredefinedColor ??
          controls.neopixel_predefined_color ??
          mockRoomStats.controls.neoPixelPredefinedColor,
      ),
      neoPixelCustomRed: clampNumber(
        controls.neoPixelCustomRed ??
          controls.neopixelCustomRed ??
          controls.neopixel_custom_red ??
          mockRoomStats.controls.neoPixelCustomRed,
        0,
        255,
        mockRoomStats.controls.neoPixelCustomRed,
      ),
      neoPixelCustomGreen: clampNumber(
        controls.neoPixelCustomGreen ??
          controls.neopixelCustomGreen ??
          controls.neopixel_custom_green ??
          mockRoomStats.controls.neoPixelCustomGreen,
        0,
        255,
        mockRoomStats.controls.neoPixelCustomGreen,
      ),
      neoPixelCustomBlue: clampNumber(
        controls.neoPixelCustomBlue ??
          controls.neopixelCustomBlue ??
          controls.neopixel_custom_blue ??
          mockRoomStats.controls.neoPixelCustomBlue,
        0,
        255,
        mockRoomStats.controls.neoPixelCustomBlue,
      ),
      neoPixelCustomBrightness: normalizeBrightness(
        controls.neoPixelCustomBrightness ??
          controls.neopixelCustomBrightness ??
          controls.neopixel_custom_brightness ??
          controls.neoPixelBrightness ??
          controls.neopixelBrightness ??
          mockRoomStats.controls.neoPixelCustomBrightness,
        mockRoomStats.controls.neoPixelCustomBrightness,
      ),
    },
    meta: {
      uiPage: String(meta.uiPage ?? mockRoomStats.meta.uiPage),
      encoderButton: Boolean(
        meta.encoderButton ?? meta.encoderButtonOn ?? mockRoomStats.meta.encoderButton,
      ),
      standby: Boolean(meta.standby ?? mockRoomStats.meta.standby),
    },
    receivedAt: new Date().toISOString(),
  };
}

export function formatStatValue(key, value, decimals = 1) {
  if (key === 'presence') {
    return value ? 'Detected' : 'Clear';
  }

  if (key === 'gasPresence') {
    return value ? 'Alert' : 'Normal';
  }

  if (typeof value === 'number') {
    return value.toFixed(decimals);
  }

  return String(value);
}

export function buildRecommendations(data) {
  const items = [];

  if (data.gasPresence) {
    items.push({
      icon: 'warning-outline',
      title: 'Ventilate Immediately',
      body: 'Gas traces were detected. Open the room and verify the source before resuming normal use.',
      tint: palette.amber,
    });
  }

  if (data.dustDensity > 45) {
    items.push({
      icon: 'cloudy-night-outline',
      title: 'Air Quality Needs Attention',
      body: 'Dust density is elevated. A quick cleanup or air purifier cycle would improve comfort.',
      tint: palette.blue,
    });
  }

  if (data.humidity < 35) {
    items.push({
      icon: 'water-outline',
      title: 'Humidity Is Running Low',
      body: 'Dry air can feel harsh over time. Consider humidification or reducing heating intensity.',
      tint: palette.cyan,
    });
  }

  if (data.temperature < data.targetTemperature - 1) {
    items.push({
      icon: 'thermometer-outline',
      title: 'Room Below Target',
      body: 'The room is cooler than your target. Turning heating on would bring it back into range.',
      tint: palette.rose,
    });
  }

  if (data.presence && !data.controls.light) {
    items.push({
      icon: 'bulb-outline',
      title: 'Presence Detected In Low Lighting',
      body: 'Someone is in the room while lights are off. A softer ambient light scene may feel better.',
      tint: palette.green,
    });
  }

  if (!items.length) {
    items.push({
      icon: 'checkmark-circle-outline',
      title: 'Room Feels Balanced',
      body: 'Current readings look stable. No adjustments are strongly recommended right now.',
      tint: palette.green,
    });
  }

  return items;
}

const idealBands = {
  temperature: { min: 21, max: 24, article: 'temperature comfort' },
  humidity: { min: 40, max: 55, article: 'humidity balance' },
  pressure: { min: 1008, max: 1020, article: 'pressure changes' },
  dustDensity: { min: 0, max: 35, article: 'indoor dust control' },
  presence: { article: 'presence automation' },
  gasPresence: { article: 'indoor air safety' },
};

const articleLinks = {
  temperatureComfort: 'https://www.energy.gov/energysaver/managing-your-homes-comfort',
  humidityBalance: 'https://www.epa.gov/indoor-air-quality-iaq/inside-story-guide-indoor-air-quality',
  pressureChanges: 'https://www.noaa.gov/jetstream/atmosphere/air-pressure',
  dustControl: 'https://www.epa.gov/indoor-air-quality-iaq/sources-indoor-particulate-matter-pm',
  airSafety: 'https://www.epa.gov/air-quality/indoor-air-quality',
  lightingComfort: 'https://www.energy.gov/energysaver/lighting-controls',
  maintenance: 'https://www.epa.gov/air-quality/indoor-air-quality',
};

export function buildInsightFeed(data) {
  const tips = [];

  if (data.temperature < idealBands.temperature.min) {
    tips.push({
      key: 'temperature-low',
      icon: 'thermometer-outline',
      title: 'Warm the room slightly',
      body: 'Raise the target temperature or reduce drafts to bring comfort back into the ideal band.',
      tint: palette.rose,
      articleTitle: 'Read more about temperature comfort',
      articleSummary: 'How indoor temperature affects comfort, focus, and energy use.',
      articleUrl: articleLinks.temperatureComfort,
    });
  } else if (data.temperature > idealBands.temperature.max) {
    tips.push({
      key: 'temperature-high',
      icon: 'sunny-outline',
      title: 'Cool the room a touch',
      body: 'A slight temperature drop will make the space feel calmer and less stuffy.',
      tint: palette.amber,
      articleTitle: 'Read more about temperature comfort',
      articleSummary: 'Simple ways to reduce overheating without making the room feel cold.',
      articleUrl: articleLinks.temperatureComfort,
    });
  }

  if (data.humidity < idealBands.humidity.min) {
    tips.push({
      key: 'humidity-low',
      icon: 'water-outline',
      title: 'Add moisture to the air',
      body: 'Humidity is low. A humidifier or gentler heating will make the room feel more comfortable.',
      tint: palette.cyan,
      articleTitle: 'Read more about humidity balance',
      articleSummary: 'Why dry indoor air affects breathing, skin comfort, and sleep quality.',
      articleUrl: articleLinks.humidityBalance,
    });
  } else if (data.humidity > idealBands.humidity.max) {
    tips.push({
      key: 'humidity-high',
      icon: 'rainy-outline',
      title: 'Reduce excess moisture',
      body: 'Humidity is elevated. Ventilation or dehumidification will help the room feel lighter.',
      tint: palette.blue,
      articleTitle: 'Read more about humidity balance',
      articleSummary: 'How excess indoor humidity changes comfort and air feel over time.',
      articleUrl: articleLinks.humidityBalance,
    });
  }

  if (data.dustDensity > idealBands.dustDensity.max) {
    tips.push({
      key: 'dust-high',
      icon: 'cloud-outline',
      title: 'Freshen up the air',
      body: 'Dust is above the comfortable range. Cleaning soft surfaces or filtering the air will help quickly.',
      tint: palette.blue,
      articleTitle: 'Read more about indoor dust control',
      articleSummary: 'Practical ways to reduce airborne particles and keep air cleaner indoors.',
      articleUrl: articleLinks.dustControl,
    });
  }

  if (data.pressure > idealBands.pressure.max) {
    tips.push({
      key: 'pressure-high',
      icon: 'rainy-outline',
      title: 'Rain is likely soon',
      body: 'Pressure is elevated beyond the normal band. It is a good moment to plan for wetter weather and dimmer light.',
      tint: palette.cyan,
      articleTitle: 'Read more about pressure changes',
      articleSummary: 'How barometric pressure shifts can signal changing weather conditions indoors and out.',
      articleUrl: articleLinks.pressureChanges,
    });
  }

  if (data.gasPresence) {
    tips.push({
      key: 'gas-alert',
      icon: 'warning-outline',
      title: 'Ventilate immediately',
      body: 'Gas presence overrides comfort recommendations. Open airflow and check the source first.',
      tint: palette.amber,
      articleTitle: 'Read more about indoor air safety',
      articleSummary: 'What to do first when an indoor air or gas alert is detected.',
      articleUrl: articleLinks.airSafety,
    });
  }

  if (data.presence && !data.controls.light) {
    tips.push({
      key: 'presence-light',
      icon: 'bulb-outline',
      title: 'Bring in softer light',
      body: 'Someone is present in the room. A low ambient light scene would make the space feel more welcoming.',
      tint: palette.green,
      articleTitle: 'Read more about presence automation',
      articleSummary: 'Using presence intelligently to improve comfort and reduce unnecessary lighting.',
      articleUrl: articleLinks.lightingComfort,
    });
  }

  if (!tips.length) {
    tips.push({
      key: 'balanced-room',
      icon: 'leaf-outline',
      title: 'Keep the room in balance',
      body: 'Conditions are currently healthy. Light ventilation and regular cleaning will keep the room feeling premium.',
      tint: palette.green,
      articleTitle: 'Read more about maintaining indoor comfort',
      articleSummary: 'Small everyday habits that keep temperature, air, and comfort in a strong zone.',
      articleUrl: articleLinks.maintenance,
    });
  }

  return tips;
}

function interpolateAqi(concentration, breakpoint) {
  const ratio = (concentration - breakpoint.cLow) / (breakpoint.cHigh - breakpoint.cLow);
  return breakpoint.iLow + ratio * (breakpoint.iHigh - breakpoint.iLow);
}

function pm25ToAqi(pm25) {
  const safePm = Math.max(0, pm25);
  const breakpoint = pm25Breakpoints.find(
    (entry) => safePm >= entry.cLow && safePm <= entry.cHigh,
  );

  if (breakpoint) {
    return interpolateAqi(safePm, breakpoint);
  }

  return 500;
}

function scoreFromAqi(aqi) {
  const scaled = 10 - (Math.min(500, Math.max(0, aqi)) / 500) * 9;
  return Math.max(1, Math.min(10, Math.round(scaled)));
}

function airQualityBand(score) {
  if (score >= 9) {
    return { label: 'Excellent', tint: palette.green };
  }

  if (score >= 7) {
    return { label: 'Good', tint: palette.cyan };
  }

  if (score >= 5) {
    return { label: 'Fair', tint: palette.amber };
  }

  if (score >= 3) {
    return { label: 'Poor', tint: palette.rose };
  }

  return { label: 'Severe', tint: palette.rose };
}

export function buildAirQualityAssessment(data) {
  const pm25Proxy = Number.isFinite(data.dustDensity) ? data.dustDensity : mockRoomStats.dustDensity;
  let proxyAqi = pm25ToAqi(pm25Proxy);

  if (data.gasPresence) {
    proxyAqi = Math.max(proxyAqi, 180);
  }

  if (data.humidity < 30 || data.humidity > 70) {
    proxyAqi += 24;
  } else if (data.humidity < 35 || data.humidity > 65) {
    proxyAqi += 10;
  }

  const score = scoreFromAqi(proxyAqi);
  const band = airQualityBand(score);

  let insight = 'Particle levels look calm, and the room feels balanced overall.';

  if (data.gasPresence) {
    insight = 'Gas presence is dominating the air assessment. Ventilation should be the first move.';
  } else if (pm25Proxy > 35.4) {
    insight = 'Dust is the main air-quality drag right now. Filtration or a quick cleanup would help.';
  } else if (data.humidity < 35) {
    insight = 'The air is reasonably clean, but dryness is pulling comfort down a bit.';
  } else if (data.humidity > 65) {
    insight = 'Moisture is a little elevated, which can make the room feel heavier over time.';
  }

  return {
    score,
    label: band.label,
    tint: band.tint,
    proxyAqi: Math.round(proxyAqi),
    pm25Proxy,
    insight,
    note: 'PM-led indoor proxy using EPA PM2.5 AQI breakpoints plus conservative defaults for unmeasured pollutants.',
  };
}

export function buildPrimaryInsight(data) {
  if (data.gasPresence) {
    return {
      title: 'Air needs immediate attention',
      body: 'Gas traces are the biggest signal in the room right now. Open airflow before adjusting comfort settings.',
      icon: 'warning-outline',
      tint: palette.amber,
    };
  }

  if (data.temperature < data.targetTemperature - 1.5) {
    return {
      title: 'Comfort is trending cool',
      body: 'The room is sitting noticeably below target temperature, so heating would have the biggest impact.',
      icon: 'thermometer-outline',
      tint: palette.rose,
    };
  }

  if (data.presence && !data.controls.light) {
    return {
      title: 'Someone is present in a dim room',
      body: 'A softer light scene would improve comfort without making the space feel harsh.',
      icon: 'bulb-outline',
      tint: palette.amber,
    };
  }

  return {
    title: 'The room feels steady',
    body: 'Temperature, air quality, and humidity are sitting in a relatively comfortable zone right now.',
    icon: 'checkmark-circle-outline',
    tint: palette.green,
  };
}
