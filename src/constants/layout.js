export const footerTabs = [
  { key: 'recommendations', icon: 'sparkles-outline', activeIcon: 'sparkles', label: 'Insights' },
  { key: 'stats', icon: 'pulse-outline', activeIcon: 'pulse', label: 'Vitals' },
  { key: 'settings', icon: 'options-outline', activeIcon: 'options', label: 'Settings' },
];

export const initialBrokerConfig = {
  url: 'ws://192.168.1.217:9001',
  hostIp: '192.168.1.217',
  port: '9001',
  username: '',
  password: '',
  topicPrefix: 'iot',
  publishNanAsNone: true,
  discoverIp: true,
  discovery: true,
  clientId: `health-hub-${Math.random().toString(16).slice(2, 8)}`,
};
