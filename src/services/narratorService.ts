import { BACKEND_URL } from '@/constants/api';
import { findItemById, isExitUnlocked, isItemVisible } from '@/engine/gameEngine';
import type { GameMap, GameState } from '@/types/game';

const TIMEOUT_MS = 8000;

function humanizeId(id: string): string {
  return id.replace(/_/g, ' ');
}

function buildObjectiveText(map: GameMap): string {
  const { type, target } = map.objective;

  if (type === 'reachRoom') {
    return `Reach: ${target.map(humanizeId).join(', ')}`;
  }

  if (type === 'collectItems') {
    const names = target.map((id) => findItemById(map, id)?.name ?? humanizeId(id));
    return `Collect: ${names.join(', ')}`;
  }

  if (type === 'defeatEnemies') {
    const names = target.map((id) => {
      const room = map.rooms.find((r) => r.enemy?.id === id);
      return room?.enemy?.name ?? humanizeId(id);
    });
    return `Defeat: ${names.join(', ')}`;
  }

  return 'Unknown objective';
}

function buildVisitedRoomsText(map: GameMap, state: GameState): string {
  const visitedIds = state.visitedRoomIds && state.visitedRoomIds.length > 0
    ? state.visitedRoomIds
    : [state.currentRoomId];

  const lines = visitedIds
    .map((roomId) => {
      const room = map.rooms.find((r) => r.id === roomId);
      if (!room) return null;

      const parts: string[] = [`"${room.description}"`];

      const visibleItems = room.items.filter((i) => isItemVisible(i, state));
      if (visibleItems.length > 0) {
        parts.push(`Items here: ${visibleItems.map((i) => i.name).join(', ')}.`);
      }

      if (room.enemy) {
        const defeated = state.defeatedEnemyIds.includes(room.enemy.id);
        parts.push(`Enemy present: ${room.enemy.name} (${defeated ? 'already defeated' : 'not yet defeated'}).`);
      }

      if (room.puzzle) {
        const solved = state.solvedPuzzleIds.includes(room.puzzle.id);
        parts.push(
          solved
            ? 'A puzzle here has already been solved.'
            : `An unsolved puzzle here reads: "${room.puzzle.prompt}"`
        );
      }

      const exitsText = room.exits
        .map((e) => `${e.direction}${isExitUnlocked(e, room.id, state) ? '' : ' (locked)'}`)
        .join(', ');
      parts.push(`Exits: ${exitsText}.`);

      return `- ${parts.join(' ')}`;
    })
    .filter((line): line is string => line !== null);

  return lines.join('\n');
}

function buildInventoryText(map: GameMap, state: GameState): string {
  if (state.inventory.length === 0) return 'Nothing.';
  const names = state.inventory.map((id) => findItemById(map, id)?.name ?? humanizeId(id));
  return names.join(', ');
}

export async function askNarrator(
  question: string,
  map: GameMap,
  state: GameState
): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${BACKEND_URL}/ask-narrator`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        mapTitle: map.title,
        objectiveText: buildObjectiveText(map),
        visitedRoomsText: buildVisitedRoomsText(map, state),
        inventoryText: buildInventoryText(map, state),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    return data.text || null;
  } catch (err) {
    clearTimeout(timeoutId);
    return null;
  }
}