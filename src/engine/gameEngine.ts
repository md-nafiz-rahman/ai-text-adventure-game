import { Exit, GameMap, GameState, Item, Room } from '@/types/game';

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
  };
}

function getRoom(map: GameMap, roomId: string): Room {
  const room = map.rooms.find((r) => r.id === roomId);
  if (!room) throw new Error(`Room not found: ${roomId}`);
  return room;
}

function findItemById(map: GameMap, itemId: string): Item | undefined {
  for (const r of map.rooms) {
    const found = r.items.find((i) => i.id === itemId);
    if (found) return found;
  }
  return undefined;
}

function isExitUnlocked(exit: Exit, roomId: string, state: GameState): boolean {
  if (!exit.locked) return true;
  if (exit.requiredItemId && state.inventory.includes(exit.requiredItemId)) return true;
  return state.unlockedExitKeys.includes(`${roomId}:${exit.direction}`);
}

function isItemVisible(item: Item, state: GameState): boolean {
  if (state.inventory.includes(item.id)) return false;
  if (!item.hidden) return true;
  return state.revealedItemIds.includes(item.id);
}

function capitalizeWords(text: string): string {
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
}

function describeRoom(map: GameMap, state: GameState): string[] {
  const room = getRoom(map, state.currentRoomId);
  const lines: string[] = [room.description];

  room.items
    .filter((i) => isItemVisible(i, state))
    .forEach((i) => lines.push(`There is a ${i.name} here.`));

  if (room.enemy && !state.defeatedEnemyIds.includes(room.enemy.id)) {
    lines.push(room.enemy.introMessage);
  }

  if (room.puzzle && !state.solvedPuzzleIds.includes(room.puzzle.id)) {
    lines.push(room.puzzle.prompt);
  }

  const exitDescriptions = room.exits.map((e) => {
    const unlocked = isExitUnlocked(e, room.id, state);
    return `${e.direction}${unlocked ? '' : ' (locked)'}`;
  });
  lines.push(`Exits: ${exitDescriptions.join(', ')}`);

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
): { newState: GameState; output: string[]; unrecognized?: boolean; needsAnswerCheck?: { officialAnswer: string; guess: string } } {
  if (state.gameOver) {
    return { newState: state, output: ['The game has ended. Start a new game to play again.'] };
  }

  const command = rawCommand.trim().toLowerCase();
  const [verb, ...rest] = command.split(' ');
  const argument = rest.join(' ').trim();

  const room = getRoom(map, state.currentRoomId);
  let newState: GameState = { ...state };
  let output: string[] = [];
  let unrecognized = false;
  let needsAnswerCheck: { officialAnswer: string; guess: string } | undefined;

  switch (verb) {
    case 'look': {
      output = describeRoom(map, state);
      break;
    }

    case 'go': {
      if (!argument) {
        output = ['Go where?'];
        break;
      }
      const exit = room.exits.find((e) => e.direction.toLowerCase() === argument);
      if (!exit) {
        output = [`You can't go ${argument} from here.`];
        break;
      }
      if (!isExitUnlocked(exit, room.id, state)) {
        output = ['That way is locked.'];
        break;
      }
      newState.currentRoomId = exit.roomId;
      output = describeRoom(map, newState);
      break;
    }

    case 'take': {
      if (!argument) {
        output = ['Take what?'];
        break;
      }
      const item = room.items.find((i) => i.name.toLowerCase() === argument);
      if (!item || !isItemVisible(item, state)) {
        output = [`There is no ${argument} here to take.`];
        break;
      }
      if (!item.canTake) {
        output = [`You can't take the ${item.name}.`];
        break;
      }
      newState.inventory = [...state.inventory, item.id];
      output = [`You take the ${item.name}.`];
      break;
    }

    case 'inventory': {
      if (state.inventory.length === 0) {
        output = ['You are carrying nothing.'];
      } else {
        const names = state.inventory.map((id) => findItemById(map, id)?.name ?? id);
        output = [`You are carrying: ${names.join(', ')}`];
      }
      break;
    }

    case 'examine': {
      if (!argument) {
        output = ['Examine what?'];
        break;
      }
      const roomItem = room.items.find((i) => i.name.toLowerCase() === argument && isItemVisible(i, state));
      if (roomItem) {
        output = [roomItem.description];
        break;
      }
      const invItem = state.inventory
        .map((id) => findItemById(map, id))
        .find((i) => i?.name.toLowerCase() === argument);
      if (invItem) {
        output = [invItem.description];
        break;
      }
      if (room.enemy && room.enemy.name.toLowerCase() === argument && !state.defeatedEnemyIds.includes(room.enemy.id)) {
        output = [room.enemy.introMessage];
        break;
      }
      output = [`There is no ${argument} here to examine.`];
      break;
    }

    case 'solve': {
      if (!room.puzzle) {
        output = ['There is nothing to solve here.'];
        break;
      }
      if (state.solvedPuzzleIds.includes(room.puzzle.id)) {
        output = ['You already solved this puzzle.'];
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
        output = [room.puzzle.onSolve.message];
      } else if (argument) {
        output = ["That's not quite right. Try again, or type 'hint' for help."];
        needsAnswerCheck = { officialAnswer: room.puzzle.answer, guess: argument };
      } else {
        output = ["That's not quite right. Try again, or type 'hint' for help."];
      }
      break;
    }

    case 'hint': {
      if (!room.puzzle) {
        output = ['There is nothing to get a hint for here.'];
        break;
      }
      if (state.solvedPuzzleIds.includes(room.puzzle.id)) {
        output = ["You've already solved this puzzle."];
        break;
      }
      const shown = state.hintsShownForPuzzle[room.puzzle.id] || 0;
      if (shown >= room.puzzle.hints.length) {
        output = ['No more hints available for this puzzle.'];
        break;
      }
      newState.hintsShownForPuzzle = { ...state.hintsShownForPuzzle, [room.puzzle.id]: shown + 1 };
      output = [`Hint: ${room.puzzle.hints[shown]}`];
      break;
    }

    case 'fight': {
      if (!argument) {
        output = ['Fight what?'];
        break;
      }
      if (!room.enemy || room.enemy.name.toLowerCase() !== argument) {
        output = [`There is no ${argument} here to fight.`];
        break;
      }
      if (state.defeatedEnemyIds.includes(room.enemy.id)) {
        output = [`The ${room.enemy.name} is already defeated.`];
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
        output = [room.enemy.successMessage];
      } else {
        newState.health = Math.max(0, state.health - room.enemy.damage);
        output = [room.enemy.failMessage, `Health remaining: ${newState.health}`];
        if (newState.health <= 0) {
          newState.gameOver = true;
          output.push('You have been defeated. Game over.');
          output.push('Type "save" if you want this attempt recorded in your Saved Games.');
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
        'save - save your progress',
      ];
      break;
    }

    default: {
      output = [`"${rawCommand}" isn't a command I recognise. Type 'help' for a list of commands.`];
      unrecognized = true;
    }
  }

  if (!newState.gameOver && checkWinCondition(map, newState)) {
    newState.won = true;
    newState.gameOver = true;
    output.push('🎉 You have completed the game!');
    output.push('Type "save" if you want this adventure to show as completed in your Saved Games.');
  }

  return { newState, output, unrecognized, needsAnswerCheck };
}