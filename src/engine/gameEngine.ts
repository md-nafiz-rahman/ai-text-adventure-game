import { Exit, GameMap, GameState, Item, LogLine, Room } from '@/types/game';

export function createInitialState(map: GameMap): GameState {
  return {
    currentRoomId: map.startRoomId,
    inventory: [],
    health: 100,
    solvedPuzzleIds: [],
    defeatedEnemyIds: [],
    unlockedExitKeys: [],
    revealedItemIds: [],
    hintsShownForPuzzle: {},
    gameOver: false,
    won: false,
    visitedRoomIds: [map.startRoomId],
  };
}

function getRoom(map: GameMap, roomId: string): Room {
  const room = map.rooms.find((r) => r.id === roomId);
  if (!room) throw new Error(`Room not found: ${roomId}`);
  return room;
}

export function findItemById(map: GameMap, itemId: string): Item | undefined {
  for (const r of map.rooms) {
    const found = r.items.find((i) => i.id === itemId);
    if (found) return found;
  }
  return undefined;
}

export function isExitUnlocked(exit: Exit, roomId: string, state: GameState): boolean {
  if (!exit.locked) return true;
  if (exit.requiredItemId && state.inventory.includes(exit.requiredItemId)) return true;
  return state.unlockedExitKeys.includes(`${roomId}:${exit.direction}`);
}

export function isItemVisible(item: Item, state: GameState): boolean {
  if (state.inventory.includes(item.id)) return false;
  if (!item.hidden) return true;
  return state.revealedItemIds.includes(item.id);
}

function capitalizeWords(text: string): string {
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
}

function describeRoom(map: GameMap, state: GameState): LogLine[] {
  const room = getRoom(map, state.currentRoomId);
  const lines: LogLine[] = [{ text: room.description, type: 'narrative' }];

  room.items
    .filter((i) => isItemVisible(i, state))
    .forEach((i) => lines.push({ text: `There is a ${i.name} here.`, type: 'item' }));

  if (room.enemy && !state.defeatedEnemyIds.includes(room.enemy.id)) {
    lines.push({ text: room.enemy.introMessage, type: 'enemy' });
  }

  if (room.puzzle && !state.solvedPuzzleIds.includes(room.puzzle.id)) {
    lines.push({ text: room.puzzle.prompt, type: 'puzzle' });
  }

  const exitDescriptions = room.exits.map((e) => {
    const unlocked = isExitUnlocked(e, room.id, state);
    return `${e.direction}${unlocked ? '' : ' (locked)'}`;
  });
  lines.push({ text: `Exits: ${exitDescriptions.join(', ')}`, type: 'system' });

  return lines;
}

function checkWinCondition(map: GameMap, state: GameState): boolean {
  const { type, target } = map.objective;
  if (type === 'reachRoom') return target.includes(state.currentRoomId);
  if (type === 'collectItems') return target.every((id) => state.inventory.includes(id));
  if (type === 'defeatEnemies') return target.every((id) => state.defeatedEnemyIds.includes(id));
  return false;
}

export type QuickAction = {
  label: string;
  command: string;
};

const MAX_QUICK_ACTIONS = 6;

export function getQuickActions(map: GameMap, state: GameState): QuickAction[] {
  if (state.gameOver) return [];

  const room = getRoom(map, state.currentRoomId);
  const actions: QuickAction[] = [];

  if (room.enemy && !state.defeatedEnemyIds.includes(room.enemy.id)) {
    actions.push({
      label: `Fight ${room.enemy.name}`,
      command: `fight ${room.enemy.name.toLowerCase()}`,
    });
  }

  if (room.puzzle && !state.solvedPuzzleIds.includes(room.puzzle.id)) {
    actions.push({ label: 'Get a Hint', command: 'hint' });
  }

  room.items
    .filter((item) => isItemVisible(item, state) && item.canTake)
    .forEach((item) => {
      actions.push({ label: `Take ${item.name}`, command: `take ${item.name.toLowerCase()}` });
    });

  room.exits
    .filter((exit) => isExitUnlocked(exit, room.id, state))
    .forEach((exit) => {
      actions.push({
        label: `Go ${capitalizeWords(exit.direction)}`,
        command: `go ${exit.direction.toLowerCase()}`,
      });
    });

  return actions.slice(0, MAX_QUICK_ACTIONS);
}

export function processCommand(
  map: GameMap,
  state: GameState,
  rawCommand: string
): { newState: GameState; output: LogLine[]; unrecognized?: boolean; needsAnswerCheck?: { officialAnswer: string; guess: string } } {
  if (state.gameOver) {
    return {
      newState: state,
      output: [{ text: 'The game has ended. Start a new game to play again.', type: 'system' }],
    };
  }

  const command = rawCommand.trim().toLowerCase();
  const [verb, ...rest] = command.split(' ');
  const argument = rest.join(' ').trim();

  const room = getRoom(map, state.currentRoomId);
  let newState: GameState = { ...state };

  if (!newState.visitedRoomIds) {
    newState.visitedRoomIds = state.currentRoomId ? [state.currentRoomId] : [];
  }

  let output: LogLine[] = [];
  let unrecognized = false;
  let needsAnswerCheck: { officialAnswer: string; guess: string } | undefined;

  const sys = (text: string): LogLine => ({ text, type: 'system' });

  switch (verb) {
    case 'look': {
      output = describeRoom(map, state);
      break;
    }

    case 'go': {
      if (!argument) {
        output = [sys('Go where?')];
        break;
      }
      const exit = room.exits.find((e) => e.direction.toLowerCase() === argument);
      if (!exit) {
        output = [sys(`You can't go ${argument} from here.`)];
        break;
      }
      if (!isExitUnlocked(exit, room.id, state)) {
        output = [sys('That way is locked.')];
        break;
      }
      newState.currentRoomId = exit.roomId;
      if (!newState.visitedRoomIds.includes(exit.roomId)) {
        newState.visitedRoomIds = [...newState.visitedRoomIds, exit.roomId];
      }
      output = describeRoom(map, newState);
      break;
    }

    case 'take': {
      if (!argument) {
        output = [sys('Take what?')];
        break;
      }
      const item = room.items.find((i) => i.name.toLowerCase() === argument);
      if (!item || !isItemVisible(item, state)) {
        output = [sys(`There is no ${argument} here to take.`)];
        break;
      }
      if (!item.canTake) {
        output = [sys(`You can't take the ${item.name}.`)];
        break;
      }
      newState.inventory = [...state.inventory, item.id];
      output = [{ text: `You take the ${item.name}.`, type: 'item' }];
      break;
    }

    case 'inventory': {
      if (state.inventory.length === 0) {
        output = [sys('You are carrying nothing.')];
      } else {
        const names = state.inventory.map((id) => findItemById(map, id)?.name ?? id);
        output = [{ text: `You are carrying: ${names.join(', ')}`, type: 'item' }];
      }
      break;
    }

    case 'examine': {
      if (!argument) {
        output = [sys('Examine what?')];
        break;
      }
      const roomItem = room.items.find((i) => i.name.toLowerCase() === argument && isItemVisible(i, state));
      if (roomItem) {
        output = [{ text: roomItem.description, type: 'item' }];
        break;
      }
      const invItem = state.inventory
        .map((id) => findItemById(map, id))
        .find((i) => i?.name.toLowerCase() === argument);
      if (invItem) {
        output = [{ text: invItem.description, type: 'item' }];
        break;
      }
      if (room.enemy && room.enemy.name.toLowerCase() === argument && !state.defeatedEnemyIds.includes(room.enemy.id)) {
        output = [{ text: room.enemy.introMessage, type: 'enemy' }];
        break;
      }
      output = [sys(`There is no ${argument} here to examine.`)];
      break;
    }

    case 'solve': {
      if (!room.puzzle) {
        output = [sys('There is nothing to solve here.')];
        break;
      }
      if (state.solvedPuzzleIds.includes(room.puzzle.id)) {
        output = [{ text: 'You already solved this puzzle.', type: 'puzzle' }];
        break;
      }

      const isExactMatch = argument === room.puzzle.answer.toLowerCase();
      const forcedCorrect = argument === '__FORCE_CORRECT__';

      if (isExactMatch || forcedCorrect) {
        newState.solvedPuzzleIds = [...state.solvedPuzzleIds, room.puzzle.id];
        if (room.puzzle.onSolve.unlocksExitDirection) {
          newState.unlockedExitKeys = [
            ...state.unlockedExitKeys,
            `${room.id}:${room.puzzle.onSolve.unlocksExitDirection}`,
          ];
        }
        if (room.puzzle.onSolve.revealsItemId) {
          newState.revealedItemIds = [...state.revealedItemIds, room.puzzle.onSolve.revealsItemId];
        }
        output = [{ text: room.puzzle.onSolve.message, type: 'puzzle' }];
      } else if (argument) {
        output = [{ text: "That's not quite right. Try again, or type 'hint' for help.", type: 'puzzle' }];
        needsAnswerCheck = { officialAnswer: room.puzzle.answer, guess: argument };
      } else {
        output = [{ text: "That's not quite right. Try again, or type 'hint' for help.", type: 'puzzle' }];
      }
      break;
    }

    case 'hint': {
      if (!room.puzzle) {
        output = [sys('There is nothing to get a hint for here.')];
        break;
      }
      if (state.solvedPuzzleIds.includes(room.puzzle.id)) {
        output = [{ text: "You've already solved this puzzle.", type: 'puzzle' }];
        break;
      }
      const shown = state.hintsShownForPuzzle[room.puzzle.id] || 0;
      if (shown >= room.puzzle.hints.length) {
        output = [{ text: 'No more hints available for this puzzle.', type: 'puzzle' }];
        break;
      }
      newState.hintsShownForPuzzle = { ...state.hintsShownForPuzzle, [room.puzzle.id]: shown + 1 };
      output = [{ text: `Hint: ${room.puzzle.hints[shown]}`, type: 'puzzle' }];
      break;
    }

    case 'fight': {
      if (!argument) {
        output = [sys('Fight what?')];
        break;
      }
      if (!room.enemy || room.enemy.name.toLowerCase() !== argument) {
        output = [sys(`There is no ${argument} here to fight.`)];
        break;
      }
      if (state.defeatedEnemyIds.includes(room.enemy.id)) {
        output = [{ text: `The ${room.enemy.name} is already defeated.`, type: 'enemy' }];
        break;
      }
      const canDefeat = room.enemy.defeatedByAnyOf.some((id) => state.inventory.includes(id));
      if (canDefeat) {
        newState.defeatedEnemyIds = [...state.defeatedEnemyIds, room.enemy.id];
        if (room.enemy.onDefeat.unlocksExitDirection) {
          newState.unlockedExitKeys = [
            ...state.unlockedExitKeys,
            `${room.id}:${room.enemy.onDefeat.unlocksExitDirection}`,
          ];
        }
        if (room.enemy.onDefeat.revealsItemId) {
          newState.revealedItemIds = [...state.revealedItemIds, room.enemy.onDefeat.revealsItemId];
        }
        output = [{ text: room.enemy.successMessage, type: 'enemy' }];
      } else {
        newState.health = Math.max(0, state.health - room.enemy.damage);
        output = [
          { text: room.enemy.failMessage, type: 'enemy' },
          { text: `Health remaining: ${newState.health}`, type: 'enemy' },
        ];
        if (newState.health <= 0) {
          newState.gameOver = true;
          output.push({ text: 'You have been defeated. Game over.', type: 'fail' });
          output.push(sys('Type "save" if you want this attempt recorded in your Saved Games.'));
        }
      }
      break;
    }

    case 'help': {
      output = [
        'Available commands:',
        'look - describe your surroundings',
        'go <direction> - move to another room',
        'take <item> - pick up an item',
        'inventory - list what you are carrying',
        'examine <item/enemy> - get a closer look',
        'solve <answer> - attempt the puzzle in this room',
        'hint - get a hint for the current puzzle',
        'fight <enemy> - attempt to defeat an enemy',
        'ask <question> - ask the narrator about the world',
        'save - save your progress',
      ].map(sys);
      break;
    }

    default: {
      output = [sys(`"${rawCommand}" isn't a command I recognise. Type 'help' for a list of commands.`)];
      unrecognized = true;
    }
  }

  if (!newState.gameOver && checkWinCondition(map, newState)) {
    newState.won = true;
    newState.gameOver = true;
    output.push({ text: '🎉 You have completed the game!', type: 'success' });
    output.push(sys('Type "save" if you want this adventure to show as completed in your Saved Games.'));
  }

  return { newState, output, unrecognized, needsAnswerCheck };
}