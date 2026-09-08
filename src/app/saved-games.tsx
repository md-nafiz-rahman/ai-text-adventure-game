import { useGameMap } from '@/contexts/GameMapContext';
import { useSettings } from '@/contexts/SettingsContext';
import { deleteSavedGame, listSavedGames, SavedGame } from '@/services/saveService';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router/react-navigation';
import { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function getStatusLabel(saved: SavedGame): 'Completed' | 'Game Over' | 'In Progress' {
  if (saved.state.won) return 'Completed';
  if (saved.state.gameOver) return 'Game Over';
  return 'In Progress';
}

export default function SavedGamesScreen() {
  const router = useRouter();
  const { resumeSave, restartSave } = useGameMap();
  const { colors } = useSettings();
  const [saves, setSaves] = useState<SavedGame[]>([]);

  const refresh = useCallback(async () => {
    setSaves(await listSavedGames());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleContinue = (saved: SavedGame) => {
    resumeSave(saved);
    router.push('/');
  };

  const handlePlayAgain = (saved: SavedGame) => {
    const status = getStatusLabel(saved);
    const message =
      status === 'Completed'
        ? `You've completed "${saved.mapTitle}". Play it again from the start?`
        : `Your last attempt at "${saved.mapTitle}" ended in defeat. Try again?`;

    Alert.alert('Play Again?', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Play Again',
        onPress: () => {
          restartSave(saved);
          router.push('/');
        },
      },
    ]);
  };

  const handleDelete = (saved: SavedGame) => {
    Alert.alert('Delete Save?', `Delete "${saved.mapTitle}"? This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteSavedGame(saved.id);
          refresh();
        },
      },
    ]);
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.accent }]}>Saved Games</Text>

      {saves.length === 0 && (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No saved games yet. Play an adventure and type "save" to store your progress here.
        </Text>
      )}

      <FlatList
        data={saves}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const status = getStatusLabel(item);
          const isInProgress = status === 'In Progress';
          const statusColor =
            status === 'Completed' ? colors.accent : status === 'Game Over' ? colors.danger : colors.info;
          const statusTextColor = status === 'Completed' ? colors.accentText : '#ffffff';

          return (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{item.mapTitle}</Text>
                <Text style={[styles.statusBadge, { backgroundColor: statusColor, color: statusTextColor }]}>
                  {status}
                </Text>
              </View>
              <Text style={[styles.savedDate, { color: colors.textMuted }]}>
                Last saved: {new Date(item.savedAt).toLocaleString()}
              </Text>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: colors.accent }]}
                  onPress={() => (isInProgress ? handleContinue(item) : handlePlayAgain(item))}
                >
                  <Text style={[styles.primaryButtonText, { color: colors.accentText }]}>
                    {isInProgress ? 'Continue' : 'Play Again'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.deleteButton, { backgroundColor: colors.card, borderColor: colors.danger }]}
                  onPress={() => handleDelete(item)}
                >
                  <Text style={[styles.deleteButtonText, { color: colors.danger }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  list: {
    paddingBottom: 40,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flexShrink: 1,
    marginRight: 8,
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    overflow: 'hidden',
  },
  savedDate: {
    fontSize: 12,
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontWeight: 'bold',
  },
  deleteButton: {
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontWeight: 'bold',
  },
});