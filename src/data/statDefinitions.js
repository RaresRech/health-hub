import { palette } from '../theme/palette';

export const statCards = [
  { key: 'dustDensity', label: 'Dust Density', unit: 'ug/m3', icon: 'cloud-outline', tint: palette.blue, decimals: 1 },
  { key: 'presence', label: 'Presence', unit: '', icon: 'person-outline', tint: palette.green },
  { key: 'pressure', label: 'Pressure', unit: 'hPa', icon: 'speedometer-outline', tint: palette.cyan, decimals: 1 },
  { key: 'temperature', label: 'Temperature', unit: 'C', icon: 'thermometer-outline', tint: palette.rose, decimals: 1 },
  { key: 'humidity', label: 'Humidity', unit: '%', icon: 'water-outline', tint: palette.blue, decimals: 0 },
  { key: 'gasPresence', label: 'Gas Presence', unit: '', icon: 'leaf-outline', tint: palette.amber },
  { key: 'targetTemperature', label: 'Target Temp', unit: 'C', icon: 'radio-button-on-outline', tint: palette.cyan, decimals: 0 },
];
