import { createInitialState, processCommand } from '@/engine/gameEngine';
import type { SavedGame } from '@/services/saveService';
import { GameMap, GameState } from '@/types/game';
import { createContext, ReactNode, useContext, useState } from 'react';

type GameMapContextValue = {
  hasStartedGame: boolean;
  saveId: string;
  map: GameMap | null;
  state: GameState | null;
  log: string[];
  setStateAndLog: (state: GameState, log: string[]) => void;
  startNewGame: (map: GameMap) => void;
  resumeSave: (saved: SavedGame) => void;
  restartSave: (saved: SavedGame) => void;
};

function freshSession(map: GameMap) {
  const initial = createInitialState(map);
  const { output } = processCommand(map, initial, 'look');
  return { state: initial, log: [map.title, '', ...output] };
}

const GameMapContext = createContext<GameMapContextValue | undefined>(undefined);

export function GameMapProvider({ children }: { children: ReactNode }) {
  const [hasStartedGame, setHasStartedGame] = useState(false);
  const [saveId, setSaveId] = useState<string>(() => Date.now().toString());
  const [map, setMap] = useState<GameMap | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const setStateAndLog = (newState: GameState, newLog: string[]) => {
    setState(newState);
    setLog(newLog);
  };

  const startNewGame = (newMap: GameMap) => {
    const fresh = freshSession(newMap);
    setSaveId(Date.now().toString());
    setMap(newMap);
    setState(fresh.state);
    setLog(fresh.log);
    setHasStartedGame(true);
  };

  const resumeSave = (saved: SavedGame) => {
    setSaveId(saved.id);
    setMap(saved.map);
    setState(saved.state);
    setLog(saved.log);
    setHasStartedGame(true);
  };

  const restartSave = (saved: SavedGame) => {
    const fresh = freshSession(saved.map);
    setSaveId(saved.id);
    setMap(saved.map);
    setState(fresh.state);
    setLog(fresh.log);
    setHasStartedGame(true);
  };

  return (
    <GameMapContext.Provider
      value={{ hasStartedGame, saveId, map, state, log, setStateAndLog, startNewGame, resumeSave, restartSave }}
    >
      {children}
    </GameMapContext.Provider>
  );
}

export function useGameMap() {
  const context = useContext(GameMapContext);
  if (!context) {
    throw new Error('useGameMap must be used within a GameMapProvider');
  }
  return context;
}