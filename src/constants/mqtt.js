export const mqttStateTopics = [
  'iot/state/#',
  'iot/select/#',
  'iot/number/#',
  'smarthub/indoor/#',
];

export const mqttCommandTopics = {
  targetTemperature: 'iot/cmd/target_temp/set',
  light: 'iot/cmd/light/set',
  uiPage: 'iot/cmd/page/set',
  neoPixelBehavior: 'iot/select/neopixel_behavior/command',
  neoPixelPredefinedColor: 'iot/select/neopixel_predefined_color/command',
  neoPixelCustomRed: 'iot/number/neopixel_custom_red/command',
  neoPixelCustomGreen: 'iot/number/neopixel_custom_green/command',
  neoPixelCustomBlue: 'iot/number/neopixel_custom_blue/command',
  neoPixelCustomBrightness: 'iot/number/neopixel_custom_brightness/command',
};
