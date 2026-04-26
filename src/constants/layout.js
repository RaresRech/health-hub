export const footerTabs = [
  { key: 'recommendations', icon: 'sparkles-outline', activeIcon: 'sparkles', label: 'Insights' },
  { key: 'stats', icon: 'pulse-outline', activeIcon: 'pulse', label: 'Vitals' },
  { key: 'settings', icon: 'options-outline', activeIcon: 'options', label: 'Settings' },
];

export const initialBrokerConfig = {
  url: 'ws://10.241.116.69:9001',
  hostIp: '10.241.116.69',
  port: '9001',
  username: '',
  password: '',
  topicPrefix: 'iot',
  publishNanAsNone: true,
  discoverIp: true,
  discovery: true,
  clientId: `health-hub-${Math.random().toString(16).slice(2, 8)}`,
};
