import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Soundboard, SoundSlot, PlaybackState } from "@/types/types";

// Helper to create a default soundboard
const createDefaultBoard = (name?: string): Soundboard => ({
  id: Date.now().toString() + Math.random().toString(36).slice(2),
  name: name || "New Soundboard",
  slots: Array(9).fill(null).map((_, index) => ({
    audioData: null,
    emoji: ["🔊", "🎵", "🎶", "🎼", "🎹", "🎸", "🥁", "🎺", "🎻"][index],
    title: `Sound ${index + 1}`,
  })) as SoundSlot[],
});

export interface SoundboardStoreState {
  boards: Soundboard[];
  activeBoardId: string | null;
  playbackStates: PlaybackState[];
  selectedDeviceId: string | null;
  hasInitialized: boolean;

  // Actions
  initializeBoards: () => Promise<void>;
  addNewBoard: () => void;
  updateBoardName: (boardId: string, name: string) => void;
  deleteBoard: (boardId: string) => void;
  setActiveBoardId: (boardId: string | null) => void;
  setSelectedDeviceId: (deviceId: string) => void;
  updateSlot: (
    boardId: string,
    slotIndex: number,
    updates: Partial<SoundSlot>
  ) => void;
  deleteSlot: (boardId: string, slotIndex: number) => void;
  setSlotPlaybackState: (
    slotIndex: number,
    isPlaying: boolean,
    isRecording?: boolean
  ) => void;
  resetSoundboardStore: () => void;
  _setBoards_internal: (boards: Soundboard[]) => void;
}

const SOUNDBOARD_STORE_VERSION = 1;
const SOUNDBOARD_STORE_NAME = "ryos:soundboard";

// Safari detection
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// Check if localStorage is available and working
const isLocalStorageAvailable = () => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    console.warn('localStorage not available:', e);
    return false;
  }
};

export const useSoundboardStore = create<SoundboardStoreState>()(
  persist(
    (set, get) => ({
      boards: [],
      activeBoardId: null,
      playbackStates: Array(9).fill({
        isRecording: false,
        isPlaying: false,
      }) as PlaybackState[],
      selectedDeviceId: null,
      hasInitialized: false,

      initializeBoards: async () => {
        if (get().hasInitialized) {
          return;
        }

        const currentBoards = get().boards;

        if (currentBoards.length > 0) {
          set({ hasInitialized: true });
          if (!get().activeBoardId) {
            set({ activeBoardId: currentBoards[0].id });
          }
          return;
        }

        try {
          // For Safari, load a lightweight version to avoid memory/storage issues
          const soundboardUrl = isSafari ? "/data/soundboards-lite.json" : "/data/soundboards.json";
          const response = await fetch(soundboardUrl);
          if (!response.ok)
            throw new Error(
              "Failed to fetch soundboards.json status: " + response.status
            );
          
          // Check response size for Safari
          const contentLength = response.headers.get('content-length');
          if (isSafari && contentLength && parseInt(contentLength) > 500000) {
            console.warn('Large soundboard data detected on Safari, using minimal data');
            // Create a minimal board for Safari to avoid crashes
            const minimalBoard = createDefaultBoard("Safari Soundboard");
            set({
              boards: [minimalBoard],
              activeBoardId: minimalBoard.id,
              hasInitialized: true,
            });
            return;
          }
          
          let data;
          try {
            data = await response.json();
          } catch (jsonError) {
            console.error('Failed to parse soundboard JSON:', jsonError);
            // If JSON parsing fails (possibly due to size), use default board
            const defaultBoard = createDefaultBoard();
            set({
              boards: [defaultBoard],
              activeBoardId: defaultBoard.id,
              hasInitialized: true,
            });
            return;
          }
          
          const importedBoardsRaw =
            data.boards || (Array.isArray(data) ? data : [data]);

          const importedBoards = importedBoardsRaw.map((boardData: Partial<Soundboard>) => ({
            id:
              boardData.id ||
              Date.now().toString() + Math.random().toString(36).slice(2),
            name: boardData.name || "Imported Soundboard",
            slots: (boardData.slots || Array(9).fill(null)).map(
              (slotData: Partial<SoundSlot> | null) => ({
                audioData: slotData?.audioData || null,
                emoji: slotData?.emoji || undefined,
                title: slotData?.title || undefined,
              })
            ),
          })) as Soundboard[];

          if (importedBoards.length > 0) {
            set({
              boards: importedBoards,
              activeBoardId: importedBoards[0].id,
              hasInitialized: true,
            });
          } else {
            const defaultBoard = createDefaultBoard();
            set({
              boards: [defaultBoard],
              activeBoardId: defaultBoard.id,
              hasInitialized: true,
            });
          }
        } catch (error) {
          console.error(
            "Error loading initial soundboards, creating default:",
            error
          );
          const defaultBoard = createDefaultBoard();
          set({
            boards: [defaultBoard],
            activeBoardId: defaultBoard.id,
            hasInitialized: true,
          });
        }
      },

      addNewBoard: () => {
        const newBoard = createDefaultBoard();
        set((state) => ({
          boards: [...state.boards, newBoard],
          activeBoardId: newBoard.id,
        }));
      },

      updateBoardName: (boardId, name) => {
        set((state) => ({
          boards: state.boards.map((board) =>
            board.id === boardId ? { ...board, name } : board
          ),
        }));
      },

      deleteBoard: (boardId) => {
        set((state) => {
          const newBoards = state.boards.filter((b) => b.id !== boardId);
          let newActiveBoardId = state.activeBoardId;
          if (state.activeBoardId === boardId) {
            newActiveBoardId = newBoards.length > 0 ? newBoards[0].id : null;
          }
          return { boards: newBoards, activeBoardId: newActiveBoardId };
        });
      },

      setActiveBoardId: (boardId) => set({ activeBoardId: boardId }),

      setSelectedDeviceId: (deviceId) => {
        set({ selectedDeviceId: deviceId });
      },

      updateSlot: (boardId, slotIndex, updates) => {
        set((state) => ({
          boards: state.boards.map((board) => {
            if (board.id === boardId) {
              const newSlots = [...board.slots];
              const currentSlot = newSlots[slotIndex] || {};
              newSlots[slotIndex] = { ...currentSlot, ...updates };
              if ("waveform" in updates) {
                // Ensure non-serializable data isn't persisted
                delete (newSlots[slotIndex] as { waveform?: unknown }).waveform;
              }
              return { ...board, slots: newSlots };
            }
            return board;
          }),
        }));
      },

      deleteSlot: (boardId, slotIndex) => {
        get().updateSlot(boardId, slotIndex, {
          audioData: null,
          emoji: undefined,
          title: undefined,
        });
      },

      setSlotPlaybackState: (slotIndex, isPlaying, isRecording) => {
        set((state) => {
          const newPlaybackStates = [...state.playbackStates];
          const currentState = newPlaybackStates[slotIndex] || {
            isPlaying: false,
            isRecording: false,
          };
          newPlaybackStates[slotIndex] = {
            isPlaying,
            isRecording:
              isRecording === undefined
                ? currentState.isRecording
                : isRecording,
          };
          return { playbackStates: newPlaybackStates };
        });
      },

      resetSoundboardStore: () => {
        const defaultBoard = createDefaultBoard();
        set({
          boards: [defaultBoard],
          activeBoardId: defaultBoard.id,
          playbackStates: Array(9).fill({
            isRecording: false,
            isPlaying: false,
          }),
          selectedDeviceId: null,
          hasInitialized: true, // Mark as initialized after reset
        });
      },

      _setBoards_internal: (boards) => set({ boards }),
    }),
    {
      name: SOUNDBOARD_STORE_NAME,
      version: SOUNDBOARD_STORE_VERSION,
      storage: isLocalStorageAvailable() ? undefined : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      },
      partialize: (state) => {
        // For Safari, limit the amount of data we store
        if (isSafari) {
          // Only store board metadata, not the audio data
          return {
            boards: state.boards.map(board => ({
              ...board,
              slots: board.slots.map(slot => ({
                ...slot,
                audioData: null // Don't persist audio data on Safari
              }))
            })),
            activeBoardId: state.activeBoardId,
            selectedDeviceId: state.selectedDeviceId,
            hasInitialized: state.hasInitialized,
          };
        }
        
        return {
          boards: state.boards,
          activeBoardId: state.activeBoardId,
          selectedDeviceId: state.selectedDeviceId,
          hasInitialized: state.hasInitialized,
        };
      },
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error("Error rehydrating soundboard store:", error);
          } else if (state) {
            // Don't auto-initialize - wait for the app to open
            // Just fix any data inconsistencies
            if (state.boards && state.boards.length > 0) {
              if (
                state.activeBoardId &&
                !state.boards.find((b) => b.id === state.activeBoardId)
              ) {
                state.activeBoardId = state.boards[0].id;
              } else if (!state.activeBoardId) {
                state.activeBoardId = state.boards[0].id;
              }
            }

            // Ensure playbackStates are properly initialized
            if (
              !state.playbackStates ||
              state.playbackStates.length !== 9 ||
              !state.playbackStates.every(
                (ps) =>
                  typeof ps === "object" &&
                  "isPlaying" in ps &&
                  "isRecording" in ps
              )
            ) {
              state.playbackStates = Array(9).fill({
                isRecording: false,
                isPlaying: false,
              });
            }
          }
        };
      },
    }
  )
);
