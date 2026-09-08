import { useSettings } from '@/contexts/SettingsContext';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MENU_ITEMS = [
  { label: 'Home', path: '/' },
  { label: 'New Game', path: '/new-game' },
  { label: 'Saved Games', path: '/saved-games' },
  { label: 'How to Play', path: '/how-to-play' },
  { label: 'Settings', path: '/settings' },
] as const;

export default function AppMenu() {
  const { colors } = useSettings();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const handleNavigate = (path: string) => {
    setOpen(false);
    router.replace(path as any);
  };

  return (
    <>
      <View style={[styles.buttonWrapper, { top: insets.top + 10 }]}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          onPress={() => setOpen(true)}
          activeOpacity={0.7}
        >
          <View style={[styles.bar, { backgroundColor: colors.accent }]} />
          <View style={[styles.bar, { backgroundColor: colors.accent }]} />
          <View style={[styles.bar, { backgroundColor: colors.accent }]} />
        </TouchableOpacity>
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View
            style={[
              styles.panel,
              { top: insets.top + 60, backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            {MENU_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.path}
                style={styles.menuItem}
                onPress={() => handleNavigate(item.path)}
              >
                <Text style={[styles.menuItemText, { color: colors.text }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  buttonWrapper: {
    position: 'absolute',
    right: 16,
    zIndex: 100,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  bar: {
    width: 20,
    height: 2,
    borderRadius: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  panel: {
    position: 'absolute',
    right: 16,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    minWidth: 180,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '600',
  },
});