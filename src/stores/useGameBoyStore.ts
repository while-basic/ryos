import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface GbaGame {
  id: string;
  name: string;
  romUrl: string;
  image: string;
  developer?: string;
  year?: number;
}

const DEFAULT_GBA_GAMES: GbaGame[] = [
  {
    id: "pokemon-emerald",
    name: "Pokémon Emerald",
    romUrl: "/assets/games/gba/pokemon-emerald.gba",
    image: "/assets/games/images/pokemon-emerald.webp",
    developer: "Game Freak",
    year: 2004,
  },
  {
    id: "pokemon-sapphire",
    name: "Pokémon Sapphire",
    romUrl: "/assets/games/gba/pokemon-sapphire.gba",
    image: "/assets/games/images/pokemon-sapphire.webp",
    developer: "Game Freak",
    year: 2002,
  },
  {
    id: "zelda-minish-cap",
    name: "The Legend of Zelda: The Minish Cap",
    romUrl: "/assets/games/gba/zelda-minish-cap.gba",
    image: "/assets/games/images/zelda-minish-cap.webp",
    developer: "Nintendo",
    year: 2004,
  },
  {
    id: "mario-kart-super-circuit",
    name: "Mario Kart: Super Circuit",
    romUrl: "/assets/games/gba/mario-kart-super-circuit.gba",
    image: "/assets/games/images/mario-kart-super-circuit.webp",
    developer: "Nintendo",
    year: 2001,
  },
  {
    id: "metroid-fusion",
    name: "Metroid Fusion",
    romUrl: "/assets/games/gba/metroid-fusion.gba",
    image: "/assets/games/images/metroid-fusion.webp",
    developer: "Nintendo",
    year: 2002,
  },
];

interface GameBoyStoreState {
  games: GbaGame[];
  currentGame: GbaGame | null;
  isEmulatorLoaded: boolean;
  saveStates: Record<string, ArrayBuffer>;
  settings: {
    volume: number;
    enableSound: boolean;
    frameSkip: number;
    showFps: boolean;
    enableRewind: boolean;
  };
  setGames: (games: GbaGame[]) => void;
  setCurrentGame: (game: GbaGame | null) => void;
  setEmulatorLoaded: (loaded: boolean) => void;
  setSaveState: (gameId: string, saveData: ArrayBuffer) => void;
  getSaveState: (gameId: string) => ArrayBuffer | null;
  updateSettings: (settings: Partial<GameBoyStoreState["settings"]>) => void;
}

export const useGameBoyStore = create<GameBoyStoreState>()(
  persist(
    (set, get) => ({
      games: DEFAULT_GBA_GAMES,
      currentGame: null,
      isEmulatorLoaded: false,
      saveStates: {},
      settings: {
        volume: 0.7,
        enableSound: true,
        frameSkip: 0,
        showFps: false,
        enableRewind: false,
      },
      setGames: (games) => set({ games }),
      setCurrentGame: (game) => set({ currentGame: game }),
      setEmulatorLoaded: (loaded) => set({ isEmulatorLoaded: loaded }),
      setSaveState: (gameId, saveData) =>
        set((state) => ({
          saveStates: { ...state.saveStates, [gameId]: saveData },
        })),
      getSaveState: (gameId) => get().saveStates[gameId] || null,
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
    }),
    {
      name: "ryos:gameboy",
      partialize: (state) => ({
        games: state.games,
        saveStates: state.saveStates,
        settings: state.settings,
      }),
    }
  )
);

// Helper functions
export const loadGbaGames = (): GbaGame[] => {
  return useGameBoyStore.getState().games;
};

export const saveGbaGames = (games: GbaGame[]): void => {
  useGameBoyStore.getState().setGames(games);
};
