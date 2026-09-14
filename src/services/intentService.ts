import { BACKEND_URL } from '@/constants/api';
import type { GameMap, GameState } from '@/types/game';

const TIMEOUT_MS = 6000;

const KNOWN_VERBS = ['look', 'go', 'take', 'inventory', 'examine', 'solve', 'hint', 'fight', 'save', 'help'];

export type DetectedIntent = {
  verb: string;
  argument: string;
};

export async function detectIntent(
  command: string,
  map: GameMap,
  state: GameState
): Promise<DetectedIntent | null> {
  const room = map.rooms.find((r) => r.id === state.currentRoomId);
  if (!room) return null;

  const availableDirections = room.exits.map((e) => e.direction);

  const visibleItemNames = room.items
    .filter((item) => !item.hidden || state.revealedItemIds.includes(item.id))
    .filter((item) => !state.inventory.includes(item.id))
    .filter((item) => item.canTake)
    .map((item) => item.name);

  const enemyName =
    room.enemy && !state.defeatedEnemyIds.includes(room.enemy.id) ? room.enemy.name : null;

  const hasPuzzle = !!(room.puzzle && !state.solvedPuzzleIds.includes(room.puzzle.id));
  const puzzleAnswer = hasPuzzle ? room.puzzle!.answer : null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${BACKEND_URL}/detect-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command,
        roomDescription: room.description,
        availableDirections,
        itemNames: visibleItemNames,
        enemyName,
        hasPuzzle,
        puzzleAnswer,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();

    if (!data.isGameAction || !data.verb || !KNOWN_VERBS.includes(data.verb)) {
      return null;
    }

    const argument = (data.argument || '').trim();

    if (data.verb === 'go') {
      const matches = availableDirections.some((d) => d.toLowerCase() === argument.toLowerCase());
      if (!matches) return null;
    }

    if (data.verb === 'take') {
      const matches = visibleItemNames.some((n) => n.toLowerCase() === argument.toLowerCase());
      if (!matches) return null;
    }

    if (data.verb === 'fight') {
      if (!enemyName || enemyName.toLowerCase() !== argument.toLowerCase()) return null;
    }

    if (data.verb === 'examine') {
      const allNames = [...visibleItemNames, ...(enemyName ? [enemyName] : [])];
      const matches = allNames.some((n) => n.toLowerCase() === argument.toLowerCase());
      if (!matches) return null;
    }

    if ((data.verb === 'solve' || data.verb === 'hint') && !hasPuzzle) {
      return null;
    }

    return { verb: data.verb, argument };
  } catch (err) {
    clearTimeout(timeoutId);
    return null;
  }
}