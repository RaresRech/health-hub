import { ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { FeedbackSurface } from '../components/FeedbackSurface';
import { GlassCard } from '../components/GlassCard';
import { ToggleRow } from '../components/ToggleRow';
import { mqttCommandTopics, mqttStateTopics } from '../constants/mqtt';
import { palette } from '../theme/palette';
import { sharedStyles } from '../theme/sharedStyles';
import { typography } from '../theme/typography';

export function SettingsPage({
  brokerConfig,
  connectionState,
  data,
  mqttDebug,
  onConfigChange,
  updateMeta,
}) {
  return (
    <ScrollView contentContainerStyle={sharedStyles.pageContent} showsVerticalScrollIndicator={false}>
      <Text style={sharedStyles.eyebrow}>Settings</Text>
      <Text style={sharedStyles.pageTitle}>Connectivity, diagnostics, and device context.</Text>

      <GlassCard feedbackEnabled={false} style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Connection</Text>
        <Text style={styles.sectionBody}>
          Point this app to a Mosquitto websocket endpoint. When none is available, the interface
          stays alive with mock readings.
        </Text>
        <Text style={styles.inputLabel}>Broker URL</Text>
        <TextInput
          autoCapitalize="none"
          onChangeText={(value) => onConfigChange('url', value)}
          placeholder="ws://broker-host:9001"
          placeholderTextColor="#5E687C"
          style={styles.input}
          value={brokerConfig.url}
        />
        <Text style={styles.inputLabel}>Broker IP</Text>
        <TextInput
          autoCapitalize="none"
          onChangeText={(value) => onConfigChange('hostIp', value)}
          placeholder="10.241.116.121"
          placeholderTextColor="#5E687C"
          style={styles.input}
          value={brokerConfig.hostIp}
        />
        <Text style={styles.inputLabel}>Broker Port</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="number-pad"
          onChangeText={(value) => onConfigChange('port', value)}
          placeholder="1883"
          placeholderTextColor="#5E687C"
          style={styles.input}
          value={brokerConfig.port}
        />
        <Text style={styles.inputLabel}>Username</Text>
        <TextInput
          autoCapitalize="none"
          onChangeText={(value) => onConfigChange('username', value)}
          placeholder="admin"
          placeholderTextColor="#5E687C"
          style={styles.input}
          value={brokerConfig.username}
        />
        <Text style={styles.inputLabel}>Password</Text>
        <TextInput
          autoCapitalize="none"
          onChangeText={(value) => onConfigChange('password', value)}
          placeholder="pass"
          placeholderTextColor="#5E687C"
          secureTextEntry
          style={styles.input}
          value={brokerConfig.password}
        />
        <Text style={styles.connectionBadge}>
          {connectionState === 'live'
            ? 'Live MQTT data received'
            : connectionState === 'connected'
              ? 'Broker connected, waiting for state messages...'
            : connectionState === 'connecting'
              ? 'Connecting...'
              : 'Mock fallback active'}
        </Text>
        <Text style={styles.topicSectionTitle}>Live Feed Status</Text>
        <Text style={styles.topicList}>
          Messages Received: {mqttDebug.messagesReceived}{'\n'}
          Last Topic: {mqttDebug.lastTopic ?? 'none yet'}{'\n'}
          Last Payload: {mqttDebug.lastPayload ?? 'none yet'}{'\n'}
          Last Message At: {mqttDebug.lastMessageAt ?? 'none yet'}
        </Text>
        <Text style={styles.topicSectionTitle}>Subscribed Topics</Text>
        <Text style={styles.topicList}>{mqttStateTopics.join('\n')}</Text>
        <Text style={styles.topicSectionTitle}>Published Commands</Text>
        <Text style={styles.topicList}>
          {Object.values(mqttCommandTopics).join('\n')}
        </Text>
        <Text style={styles.topicSectionTitle}>Broker Flags</Text>
        <Text style={styles.topicList}>
          Topic Prefix: {brokerConfig.topicPrefix}{'\n'}
          Host: {brokerConfig.hostIp}:{brokerConfig.port}{'\n'}
          Publish NaN As None: {brokerConfig.publishNanAsNone ? 'true' : 'false'}{'\n'}
          Discover IP: {brokerConfig.discoverIp ? 'true' : 'false'}{'\n'}
          Discovery: {brokerConfig.discovery ? 'true' : 'false'}
        </Text>
      </GlassCard>

      <GlassCard feedbackEnabled={false} style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Device Metadata</Text>
        <FeedbackSurface style={styles.metaRow}>
          <Text style={styles.metaLabel}>UI Page</Text>
          <Text style={styles.metaValue}>{data.meta.uiPage}</Text>
        </FeedbackSurface>
        <ToggleRow
          description="Reflects the current encoder press state."
          icon="ellipse-outline"
          label="Encoder Button"
          onValueChange={(value) => updateMeta('encoderButton', value)}
          tint={palette.green}
          value={data.meta.encoderButton}
        />
        <ToggleRow
          description="Dims the device when the room should stay quiet."
          icon="moon-outline"
          label="Standby"
          onValueChange={(value) => updateMeta('standby', value)}
          tint={palette.blue}
          value={data.meta.standby}
        />
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    padding: 20,
    gap: 14,
  },
  sectionTitle: {
    ...typography.titleMedium,
    color: palette.text,
  },
  sectionBody: {
    ...typography.body,
    color: '#B2BDD1',
  },
  inputLabel: {
    ...typography.bodySmall,
    color: palette.subtext,
  },
  input: {
    backgroundColor: palette.cardSoft,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: palette.text,
    ...typography.label,
  },
  connectionBadge: {
    ...typography.body,
    color: palette.text,
  },
  topicSectionTitle: {
    ...typography.body,
    color: palette.text,
    fontWeight: '600',
    marginTop: 4,
  },
  topicList: {
    ...typography.caption,
    color: palette.subtext,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: 6,
  },
  metaLabel: {
    ...typography.label,
    color: palette.subtext,
    flexShrink: 1,
  },
  metaValue: {
    ...typography.label,
    color: palette.text,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
});
