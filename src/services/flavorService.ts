import { BACKEND_URL } from '@/constants/api';
import type { GameMap, GameState } from '@/types/game';

const TIMEOUT_MS = 8000;


const SUSPICIOUS_PATTERNS = [
  /reveal(s|ing)? an? \w+/i,
  /you (find|found|obtain|receive|pick up)/i,
  /unlocks?/i,
  /the (door|chest|path) opens?/i,
  /adds? .* to your inventory/i,
];

function containsStateChangeClaim(text: string): boolean {
  return SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(text));
}

export async function getFlavorResponse(
  command: string,
  map: GameMap,
  state: GameState
): Promise<string | null> {
  const room = map.rooms.find((r) => r.id === state.currentRoomId);
  if (!room) return null;

  const visibleItemNames = room.items
    .filter((item) => !item.hidden || state.revealedItemIds.includes(item.id))
    .filter((item) => !state.inventory.includes(item.id))
    .map((item) => item.name);

  const enemyName =
    room.enemy && !state.defeatedEnemyIds.includes(room.enemy.id) ? room.enemy.name : null;

  const hasPuzzle = !!(room.puzzle && !state.solvedPuzzleIds.includes(room.puzzle.id));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${BACKEND_URL}/flavor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command,
        roomDescription: room.description,
        itemNames: visibleItemNames,
        enemyName,
        hasPuzzle,
        mapTitle: map.title,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    const text = data.text || null;

    if (text && containsStateChangeClaim(text)) {
      console.warn('Flavor response discarded, claimed a state change:', text);
      return null;
    }

    return text;
  } catch (err) {
    clearTimeout(timeoutId);
    return null;
  }
}