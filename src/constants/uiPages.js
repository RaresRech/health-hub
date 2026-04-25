export const uiPages = {
  thermostat: '0',
  currentTemp: '1',
  humidity: '2',
  pressure: '3',
  dust: '4',
  light: '5',
  presence: '6',
};

export const statKeyToUiPage = {
  dustDensity: uiPages.dust,
  presence: uiPages.presence,
  pressure: uiPages.pressure,
  temperature: uiPages.currentTemp,
  humidity: uiPages.humidity,
  targetTemperature: uiPages.thermostat,
};
