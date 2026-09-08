export type Item = {
  id: string;
  name: string;
  description: string;
  canTake: boolean;
  hidden?: boolean;
};

export type Exit = {
  direction: string;
  roomId: string;
  locked?: boolean;
  requiredItemId?: string;
};

export type Puzzle = {
  id: string;
  prompt: string;
  answer: string;
  hints: string[];
  onSolve: {
    message: string;
    unlocksExitDirection?: string;
    revealsItemId?: string;
  };
};

export type Enemy = {
  id: string;
  name: string;
  introMessage: string;
  defeatedByAnyOf: string[];
  damage: number;
  successMessage: string;
  failMessage: string;
  onDefeat: {
    revealsItemId?: string;
    unlocksExitDirection?: string;
  };
};

export type Room = {
  id: string;
  description: string;
  exits: Exit[];
  items: Item[];
  puzzle?: Puzzle;
  enemy?: Enemy;
};

export type GameMap = {
  title: string;
  startRoomId: string;
  rooms: Room[];
  objective: {
    type: 'reachRoom' | 'collectItems' | 'defeatEnemies';
    target: string[];
  };
};

export type GameState = {
  currentRoomId: string;
  inventory: string[];
  health: number;
  solvedPuzzleIds: string[];
  defeatedEnemyIds: string[];
  unlockedExitKeys: string[];
  revealedItemIds: string[];
  hintsShownForPuzzle: Record<string, number>;
  gameOver: boolean;
  won: boolean;
};