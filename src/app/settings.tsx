import { useSettings } from '@/contexts/SettingsContext';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

export default function SettingsScreen() {
  const { themeMode, setThemeMode, colors, quickActionsEnabled, setQuickActionsEnabled } = useSettings();

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.accent }]}>Settings</Text>

      <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.rowText}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Light Theme</Text>
          <Text style={[styles.rowDescription, { color: colors.textSecondary }]}>
            Switch between a dark or light look for the whole app.
          </Text>
        </View>
        <Switch
          value={themeMode === 'light'}
          onValueChange={(value) => setThemeMode(value ? 'light' : 'dark')}
          trackColor={{ false: colors.cardBorder, true: colors.accent }}
          thumbColor="#ffffff"
        />
      </View>

      <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.rowText}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Suggested Actions</Text>
          <Text style={[styles.rowDescription, { color: colors.textSecondary }]}>
            Show tappable suggestions above the text box, like "Take flashlight" or "Go north".
          </Text>
        </View>
        <Switch
          value={quickActionsEnabled}
          onValueChange={setQuickActionsEnabled}
          trackColor={{ false: colors.cardBorder, true: colors.accent }}
          thumbColor="#ffffff"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  rowText: {
    flex: 1,
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  rowDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
});