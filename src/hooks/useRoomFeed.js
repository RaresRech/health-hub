import { useEffect, useRef, useState } from 'react';
import mqtt from 'mqtt';
import { initialBrokerConfig } from '../constants/layout';
import { mqttCommandTopics, mqttStateTopics } from '../constants/mqtt';
import { mockRoomStats } from '../data/mockRoomStats';
import { normalizePayload } from '../utils/roomData';

function createSeries(seed, variance, count = 20, minimum = -Infinity) {
  return Array.from({ length: count }, (_, index) => {
    const drift = Math.sin(index / 2.7) * variance;
    return Math.max(minimum, Number((seed + drift).toFixed(1)));
  });
}

function createInitialHistory(source) {
  return {
    temperature: createSeries(source.temperature, 0.8, 20),
    humidity: createSeries(source.humidity, 4.5, 20, 0),
    pressure: createSeries(source.pressure, 2.2, 20, 900),
    dustDensity: createSeries(source.dustDensity, 6.2, 20, 0),
    detectionDistance: createSeries(source.detectionDistance, 12, 20, 0),
  };
}

function appendHistoryValue(history, key, value) {
  if (!Number.isFinite(value)) {
    return history;
  }

  const nextValues = [...history[key], Number(value.toFixed(1))].slice(-20);
  return {
    ...history,
    [key]: nextValues,
  };
}

function tryJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeScalarValue(value) {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'nan' || normalized === 'none' || normalized === 'null' || normalized === '') {
    return null;
  }

  return value;
}

function extractCandidateValue(value, preferredKeys = []) {
  if (value === null || value === undefined) {
    return null;
  }

  if (!isPlainObject(value)) {
    return value;
  }

  for (const key of preferredKeys) {
    if (value[key] !== undefined) {
      return extractCandidateValue(value[key]);
    }
  }

  const fallbackKeys = ['value', 'state', 'payload', 'data', 'reading'];
  for (const key of fallbackKeys) {
    if (value[key] !== undefined) {
      return extractCandidateValue(value[key]);
    }
  }

  const firstPrimitive = Object.values(value).find((entry) => !isPlainObject(entry));
  if (firstPrimitive !== undefined) {
    return extractCandidateValue(firstPrimitive);
  }

  return null;
}

function parseBooleanValue(value) {
  const candidate = extractCandidateValue(value, ['value', 'state', 'present', 'presence']);

  if (candidate === null || candidate === undefined) {
    return false;
  }

  if (typeof candidate === 'boolean') {
    return candidate;
  }

  if (typeof candidate === 'number') {
    return candidate > 0;
  }

  if (typeof candidate === 'string') {
    const normalized = candidate.trim().toLowerCase();
    return ['1', 'true', 'on', 'yes', 'detected', 'present'].includes(normalized);
  }

  return Boolean(candidate);
}

function parseNumberValue(value, fallback) {
  const candidate = extractCandidateValue(value, [
    'value',
    'reading',
    'temperature',
    'temp',
    'humidity',
    'pressure',
    'dust',
    'distance',
    'detectionDistance',
    'detection_distance',
    'room_temp',
    'room_humidity',
    'target_temp',
  ]);

  if (candidate === null || candidate === undefined) {
    return fallback;
  }

  const parsed = Number(candidate);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseStringValue(value, fallback) {
  const candidate = extractCandidateValue(value, ['value', 'state', 'mode', 'color', 'preset']);

  if (candidate === null || candidate === undefined) {
    return fallback;
  }

  return String(candidate);
}

function parseClampedNumberValue(value, fallback, min, max) {
  const parsed = parseNumberValue(value, fallback);
  return Math.min(max, Math.max(min, parsed));
}

function parseBrightnessValue(value, fallback) {
  const parsed = parseNumberValue(value, fallback);
  const normalized = parsed > 1 ? parsed / 100 : parsed;
  return Math.min(1, Math.max(0.05, normalized));
}

function assignNumberPatch(patch, key, value, fallback, isValid = Number.isFinite) {
  if (value === undefined || value === null) {
    return;
  }

  const parsed = parseNumberValue(value, fallback);
  if (isValid(parsed)) {
    patch[key] = parsed;
  }
}

function normalizeTopicKey(topic) {
  const normalized = topic
    .toLowerCase()
    .replace(/^iot\/state\//, '')
    .replace(/^iot\/select\//, '')
    .replace(/^iot\/number\//, '')
    .replace(/^smarthub\/indoor\//, '')
    .replace(/\/state$/, '')
    .replace(/\/command$/, '')
    .replace(/[/-]/g, '_');

  return normalized
    .replace(/^neo_pixel_/, 'neopixel_')
    .replace(/^neo_pixels_/, 'neopixel_');
}

function normalizeNeoPixelBehavior(value) {
  const normalized = String(value ?? '').trim().toLowerCase().replace(/[_-]/g, ' ');

  if (normalized === 'automatic' || normalized === 'auto') {
    return 'Automatic';
  }

  if (normalized === 'predefined color' || normalized === 'predefined') {
    return 'Predefined Color';
  }

  if (normalized === 'custom color' || normalized === 'custom') {
    return 'Custom Color';
  }

  return mockRoomStats.controls.neoPixelBehavior;
}

function normalizeNeoPixelPreset(value) {
  const normalized = String(value ?? '').trim().toLowerCase().replace(/[_-]/g, ' ');
  const presets = ['Orange', 'Blue', 'Warm White', 'Green', 'Purple', 'Dust Gold'];
  return presets.find((preset) => preset.toLowerCase() === normalized) ??
    mockRoomStats.controls.neoPixelPredefinedColor;
}

function readFromSources(sources, keys) {
  for (const source of sources) {
    if (!isPlainObject(source)) {
      continue;
    }

    for (const key of keys) {
      if (source[key] !== undefined) {
        return source[key];
      }
    }
  }

  return undefined;
}

function buildPatchFromTopic(topic, rawPayload) {
  const textPayload = normalizeScalarValue(rawPayload.toString().trim());
  const jsonPayload = tryJsonParse(textPayload);
  const topicKey = normalizeTopicKey(topic);
  const payload = typeof jsonPayload === 'object' && jsonPayload ? jsonPayload : {};
  const controlsPayload = isPlainObject(payload.controls) ? payload.controls : {};

  switch (topicKey) {
    case 'room_temp':
      return {
        temperature: parseNumberValue(
          jsonPayload ?? textPayload,
          mockRoomStats.temperature,
        ),
      };
    case 'room_humidity':
      return {
        humidity: parseNumberValue(
          jsonPayload ?? textPayload,
          mockRoomStats.humidity,
        ),
      };
    case 'pressure':
      return { pressure: parseNumberValue(jsonPayload ?? textPayload, mockRoomStats.pressure) };
    case 'dust':
      return { dustDensity: parseNumberValue(jsonPayload ?? textPayload, mockRoomStats.dustDensity) };
    case 'distance':
    case 'detection_distance':
      return {
        detectionDistance: parseNumberValue(
          jsonPayload ?? textPayload,
          mockRoomStats.detectionDistance,
        ),
      };
    case 'target_temp':
      return {
        targetTemperature: parseNumberValue(
          jsonPayload ?? textPayload,
          mockRoomStats.targetTemperature,
        ),
      };
    case 'ui_page':
      return {
        meta: {
          uiPage: String(jsonPayload ?? textPayload),
        },
      };
    case 'heating':
      return {
        controls: {
          heating: parseBooleanValue(jsonPayload ?? textPayload),
        },
      };
    case 'light':
      return {
        controls: {
          light: parseBooleanValue(jsonPayload ?? textPayload),
        },
      };
    case 'presence':
      return {
        presence: parseBooleanValue(jsonPayload ?? textPayload),
      };
    case 'neopixel_behavior':
    case 'neo_pixel_behavior':
      return {
        controls: {
          neoPixelBehavior: normalizeNeoPixelBehavior(
            parseStringValue(jsonPayload ?? textPayload, mockRoomStats.controls.neoPixelBehavior),
          ),
        },
      };
    case 'neopixel_predefined_color':
    case 'neo_pixel_predefined_color':
      return {
        controls: {
          neoPixelPredefinedColor: normalizeNeoPixelPreset(
            parseStringValue(
              jsonPayload ?? textPayload,
              mockRoomStats.controls.neoPixelPredefinedColor,
            ),
          ),
        },
      };
    case 'neopixel_custom_red':
    case 'neo_pixel_custom_red':
      return {
        controls: {
          neoPixelCustomRed: parseClampedNumberValue(
            jsonPayload ?? textPayload,
            mockRoomStats.controls.neoPixelCustomRed,
            0,
            255,
          ),
        },
      };
    case 'neopixel_custom_green':
    case 'neo_pixel_custom_green':
      return {
        controls: {
          neoPixelCustomGreen: parseClampedNumberValue(
            jsonPayload ?? textPayload,
            mockRoomStats.controls.neoPixelCustomGreen,
            0,
            255,
          ),
        },
      };
    case 'neopixel_custom_blue':
    case 'neo_pixel_custom_blue':
      return {
        controls: {
          neoPixelCustomBlue: parseClampedNumberValue(
            jsonPayload ?? textPayload,
            mockRoomStats.controls.neoPixelCustomBlue,
            0,
            255,
          ),
        },
      };
    case 'neopixel_custom_brightness':
    case 'neo_pixel_custom_brightness':
      return {
        controls: {
          neoPixelCustomBrightness: parseBrightnessValue(
            jsonPayload ?? textPayload,
            mockRoomStats.controls.neoPixelCustomBrightness,
          ),
        },
      };
    case 'environment': {
      const sources = [controlsPayload, payload];
      const patch = {};
      const temperature = payload.temperature ?? payload.temp ?? payload.room_temp;
      const humidity = payload.humidity ?? payload.hum ?? payload.room_humidity;
      const pressure = payload.pressure ?? payload.pres ?? payload.room_pressure;
      const detectionDistance =
        payload.detectionDistance ?? payload.detection_distance ?? payload.distance;
      const gasPresence = payload.gasPresence ?? payload.gas;

      assignNumberPatch(patch, 'temperature', temperature, mockRoomStats.temperature);
      assignNumberPatch(patch, 'humidity', humidity, mockRoomStats.humidity);
      assignNumberPatch(
        patch,
        'pressure',
        pressure,
        mockRoomStats.pressure,
        (value) => Number.isFinite(value) && value > 0,
      );
      assignNumberPatch(
        patch,
        'detectionDistance',
        detectionDistance,
        mockRoomStats.detectionDistance,
      );

      if (gasPresence !== undefined) {
        patch.gasPresence = parseBooleanValue(gasPresence);
      }
      const neoPixelPayload = {
        neoPixelBehavior: readFromSources(sources, [
          'neoPixelBehavior',
          'neopixelBehavior',
          'neopixel_behavior',
        ]),
        neoPixelPredefinedColor:
          readFromSources(sources, [
            'neoPixelPredefinedColor',
            'neopixelPredefinedColor',
            'neopixel_predefined_color',
          ]),
        neoPixelCustomRed: readFromSources(sources, [
          'neoPixelCustomRed',
          'neopixelCustomRed',
          'neopixel_custom_red',
        ]),
        neoPixelCustomGreen: readFromSources(sources, [
          'neoPixelCustomGreen',
          'neopixelCustomGreen',
          'neopixel_custom_green',
        ]),
        neoPixelCustomBlue: readFromSources(sources, [
          'neoPixelCustomBlue',
          'neopixelCustomBlue',
          'neopixel_custom_blue',
        ]),
        neoPixelCustomBrightness:
          readFromSources(sources, [
            'neoPixelCustomBrightness',
            'neopixelCustomBrightness',
            'neopixel_custom_brightness',
            'neoPixelBrightness',
            'neopixelBrightness',
          ]),
      };
      const hasNeoPixelPayload = Object.values(neoPixelPayload).some(
        (value) => value !== undefined,
      );
      const controlsPatch = {};
      const heating = readFromSources(sources, ['heating', 'heatingOn', 'heating_on']);
      const light = readFromSources(sources, ['light', 'lightOn', 'light_on']);

      if (heating !== undefined) {
        controlsPatch.heating = parseBooleanValue(heating);
      }

      if (light !== undefined) {
        controlsPatch.light = parseBooleanValue(light);
      }

      if (hasNeoPixelPayload) {
        if (neoPixelPayload.neoPixelBehavior !== undefined) {
          controlsPatch.neoPixelBehavior = normalizeNeoPixelBehavior(
            parseStringValue(
              neoPixelPayload.neoPixelBehavior,
              mockRoomStats.controls.neoPixelBehavior,
            ),
          );
        }

        if (neoPixelPayload.neoPixelPredefinedColor !== undefined) {
          controlsPatch.neoPixelPredefinedColor = normalizeNeoPixelPreset(
            parseStringValue(
              neoPixelPayload.neoPixelPredefinedColor,
              mockRoomStats.controls.neoPixelPredefinedColor,
            ),
          );
        }

        if (neoPixelPayload.neoPixelCustomRed !== undefined) {
          controlsPatch.neoPixelCustomRed = parseClampedNumberValue(
            neoPixelPayload.neoPixelCustomRed,
            mockRoomStats.controls.neoPixelCustomRed,
            0,
            255,
          );
        }

        if (neoPixelPayload.neoPixelCustomGreen !== undefined) {
          controlsPatch.neoPixelCustomGreen = parseClampedNumberValue(
            neoPixelPayload.neoPixelCustomGreen,
            mockRoomStats.controls.neoPixelCustomGreen,
            0,
            255,
          );
        }

        if (neoPixelPayload.neoPixelCustomBlue !== undefined) {
          controlsPatch.neoPixelCustomBlue = parseClampedNumberValue(
            neoPixelPayload.neoPixelCustomBlue,
            mockRoomStats.controls.neoPixelCustomBlue,
            0,
            255,
          );
        }

        if (neoPixelPayload.neoPixelCustomBrightness !== undefined) {
          controlsPatch.neoPixelCustomBrightness = parseBrightnessValue(
            neoPixelPayload.neoPixelCustomBrightness,
            mockRoomStats.controls.neoPixelCustomBrightness,
          );
        }
      }

      if (Object.keys(controlsPatch).length) {
        patch.controls = controlsPatch;
      }

      return patch;
    }
    default:
      return null;
  }
}

export function useRoomFeed() {
  const [brokerConfig, setBrokerConfig] = useState(initialBrokerConfig);
  const [connectionState, setConnectionState] = useState('mock');
  const [data, setData] = useState(normalizePayload(mockRoomStats));
  const [history, setHistory] = useState(createInitialHistory(mockRoomStats));
  const [mqttDebug, setMqttDebug] = useState({
    lastTopic: null,
    lastPayload: null,
    lastMessageAt: null,
    messagesReceived: 0,
  });
  const clientRef = useRef(null);

  useEffect(() => {
    if (!brokerConfig.url) {
      setConnectionState('mock');
      setData(normalizePayload(mockRoomStats));
      setHistory(createInitialHistory(mockRoomStats));
      setMqttDebug({
        lastTopic: null,
        lastPayload: null,
        lastMessageAt: null,
        messagesReceived: 0,
      });
      return undefined;
    }

    setConnectionState('connecting');

    const client = mqtt.connect(brokerConfig.url, {
      clientId: brokerConfig.clientId,
      username: brokerConfig.username,
      password: brokerConfig.password,
      reconnectPeriod: 3000,
      connectTimeout: 5000,
    });

    clientRef.current = client;

    client.on('connect', () => {
      setConnectionState('connected');
      client.subscribe(mqttStateTopics, (error) => {
        if (error) {
          console.warn('MQTT subscribe failed', error);
        }
      });
    });

    client.on('message', (topic, payloadBuffer) => {
      try {
        const patch = buildPatchFromTopic(topic, payloadBuffer);
        if (!patch) {
          return;
        }

        setConnectionState('live');
        setMqttDebug((current) => ({
          lastTopic: topic,
          lastPayload: payloadBuffer.toString().trim(),
          lastMessageAt: new Date().toISOString(),
          messagesReceived: current.messagesReceived + 1,
        }));
        setData((current) => {
          const next = normalizePayload({
            ...current,
            ...patch,
            controls: {
              ...current.controls,
              ...patch.controls,
            },
          });
          setHistory((currentHistory) => {
            let nextHistory = currentHistory;
            nextHistory = appendHistoryValue(nextHistory, 'temperature', next.temperature);
            nextHistory = appendHistoryValue(nextHistory, 'humidity', next.humidity);
            nextHistory = appendHistoryValue(nextHistory, 'pressure', next.pressure);
            nextHistory = appendHistoryValue(nextHistory, 'dustDensity', next.dustDensity);
            nextHistory = appendHistoryValue(
              nextHistory,
              'detectionDistance',
              next.detectionDistance,
            );
            return nextHistory;
          });
          return next;
        });
      } catch (error) {
        console.warn(`Unable to parse MQTT payload for topic ${topic}`, error);
      }
    });

    client.on('reconnect', () => {
      setConnectionState('connecting');
    });

    client.on('error', () => {
      setConnectionState('mock');
    });

    client.on('offline', () => {
      setConnectionState('mock');
    });

    return () => {
      client.end(true);
      clientRef.current = null;
    };
  }, [brokerConfig]);

  const publishCommand = (topic, value) => {
    const client = clientRef.current;
    if (!client?.connected) {
      return;
    }

    client.publish(topic, String(value));
  };

  const updateControl = (key, value) => {
    setData((current) => ({
      ...current,
      controls: {
        ...current.controls,
        [key]: value,
      },
    }));

    if (key === 'light') {
      publishCommand(mqttCommandTopics.light, value ? 'on' : 'off');
    }
  };

  const updateMeta = (key, value) => {
    setData((current) => ({
      ...current,
      meta: {
        ...current.meta,
        [key]: value,
      },
    }));

    if (key === 'uiPage') {
      publishCommand(mqttCommandTopics.uiPage, value);
    }
  };

  const updateTargetTemperature = (value) => {
    setData((current) => ({
      ...current,
      targetTemperature: value,
    }));

    publishCommand(mqttCommandTopics.targetTemperature, value);
  };

  const updateNeoPixel = (patch) => {
    setData((current) => ({
      ...current,
      controls: {
        ...current.controls,
        ...patch,
      },
    }));

    Object.entries(patch).forEach(([key, value]) => {
      const topic = mqttCommandTopics[key];
      if (topic) {
        publishCommand(topic, value);
      }
    });
  };

  return {
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
  };
}
