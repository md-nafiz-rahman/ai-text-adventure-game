import { GameMap, GameState } from '@/types/game';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVE_PREFIX = 'save:';

export type SavedGame = {
  id: string;
  mapTitle: string;
  map: GameMap;
  state: GameState;
  log: string[];
  savedAt: number;
};

export async function saveGame(
  id: string,
  map: GameMap,
  state: GameState,
  log: string[]
): Promise<void> {
  const savedGame: SavedGame = {
    id,
    mapTitle: map.title,
    map,
    state,
    log,
    savedAt: Date.now(),
  };
  await AsyncStorage.setItem(`${SAVE_PREFIX}${id}`, JSON.stringify(savedGame));
}

export async function listSavedGames(): Promise<SavedGame[]> {
  const allKeys = await AsyncStorage.getAllKeys();
  const saveKeys = allKeys.filter((k) => k.startsWith(SAVE_PREFIX));
  if (saveKeys.length === 0) return [];

  const entries = await AsyncStorage.multiGet(saveKeys);
  const games = entries
    .map(([, value]) => (value ? (JSON.parse(value) as SavedGame) : null))
    .filter((g): g is SavedGame => g !== null);

  games.sort((a, b) => b.savedAt - a.savedAt);
  return games;
}

export async function deleteSavedGame(id: string): Promise<void> {
  await AsyncStorage.removeItem(`${SAVE_PREFIX}${id}`);
}