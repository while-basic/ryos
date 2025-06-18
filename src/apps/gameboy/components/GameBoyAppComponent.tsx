import { useState, useEffect, useContext } from "react";
import { AppProps } from "@/apps/base/types";
import { WindowFrame } from "@/components/layout/WindowFrame";
import { GameBoyMenuBar } from "./GameBoyMenuBar";
import { HelpDialog } from "@/components/dialogs/HelpDialog";
import { AboutDialog } from "@/components/dialogs/AboutDialog";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { helpItems, appMetadata } from "..";
import { GbaGame, useGameBoyStore } from "@/stores/useGameBoyStore";
import { motion } from "framer-motion";
import { GbaProvider, GbaContext } from "react-gbajs";
import ReactGbaJs from "react-gbajs";

function GameBoyEmulator({
  selectedGame,
  settings,
  onGameLoaded,
}: {
  selectedGame: GbaGame | null;
  settings: {
    enableSound: boolean;
    volume: number;
    showFps: boolean;
  };
  onGameLoaded: () => void;
}) {
  const { play, saveState, gba } = useContext(GbaContext);
  const [isLoading, setIsLoading] = useState(false);
  const [coreLoaded, setCoreLoaded] = useState(false);

  // Load GBA.js core files
  useEffect(() => {
    const loadGBACore = async () => {
      try {
        // Check if ARMCoreArm is already defined
        if (window.ARMCoreArm) {
          setCoreLoaded(true);
          return;
        }

        // Load core GBA.js files in the correct order
        const scripts = [
          '/gbajs/util.js',
          '/gbajs/arm.js',
          '/gbajs/thumb.js',
          '/gbajs/mmu.js',
          '/gbajs/io.js',
          '/gbajs/audio.js',
          '/gbajs/video.js',
          '/gbajs/savedata.js',
          '/gbajs/core.js',
          '/gbajs/gba.js'
        ];

        for (const src of scripts) {
          // Check if script is already loaded
          if (document.querySelector(`script[src="${src}"]`)) {
            continue;
          }

          const script = document.createElement('script');
          script.src = src;
          script.async = false;
          document.head.appendChild(script);
          
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
          });
        }
        
        setCoreLoaded(true);
        console.log('GBA.js core loaded successfully');
      } catch (error) {
        console.error('Failed to load GBA.js core:', error);
        setCoreLoaded(true); // Still allow the component to render
      }
    };

    if (!coreLoaded) {
      loadGBACore();
    }
  }, [coreLoaded]);

  useEffect(() => {
    if (selectedGame) {
      setIsLoading(true);
      // Simulate ROM loading - in a real app you'd fetch the ROM file
      fetch(selectedGame.romUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error(`ROM not found: ${selectedGame.romUrl}`);
          }
          return response.arrayBuffer();
        })
        .then(romBuffer => {
          const success = play({ newRomBuffer: romBuffer });
          if (success) {
            onGameLoaded();
          }
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Failed to load ROM:', error);
          setIsLoading(false);
        });
    }
  }, [selectedGame, play, onGameLoaded]);

  const handleSaveState = () => {
    try {
      const state = saveState();
      if (state && selectedGame) {
        // Store the save state in our custom store
        const { setSaveState } = useGameBoyStore.getState();
        setSaveState(selectedGame.id, state);
        console.log('Game state saved for:', selectedGame.name);
      }
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  };

  const handleLoadState = () => {
    try {
      if (selectedGame) {
        const { getSaveState } = useGameBoyStore.getState();
        const state = getSaveState(selectedGame.id);
        if (state && selectedGame) {
          // Reload the ROM with the saved state
          fetch(selectedGame.romUrl)
            .then(response => response.arrayBuffer())
            .then(romBuffer => {
              play({ newRomBuffer: romBuffer, restoreState: state });
              console.log('Game state loaded for:', selectedGame.name);
            })
            .catch(error => {
              console.error('Failed to load ROM for state restore:', error);
            });
        } else {
          console.log('No save state found for:', selectedGame.name);
        }
      }
    } catch (error) {
      console.error('Failed to load state:', error);
    }
  };

  const handleReset = () => {
    try {
      if (selectedGame) {
        // Reset by reloading the ROM
        fetch(selectedGame.romUrl)
          .then(response => response.arrayBuffer())
          .then(romBuffer => {
            play({ newRomBuffer: romBuffer });
            console.log('Game reset:', selectedGame.name);
          })
          .catch(error => {
            console.error('Failed to reset game:', error);
          });
      }
    } catch (error) {
      console.error('Failed to reset game:', error);
    }
  };

  const handlePause = () => {
    try {
      // GBA.js doesn't have a direct pause, but we can stop audio
      if (gba && gba.audio) {
        gba.audio.pause();
        console.log('Game paused:', selectedGame?.name);
      }
    } catch (error) {
      console.error('Failed to pause game:', error);
    }
  };

  // Expose functions to parent component
  useEffect(() => {
    window.gameBoyActions = {
      saveState: handleSaveState,
      loadState: handleLoadState,
      reset: handleReset,
      pause: handlePause,
    };
  }, [selectedGame]);

  if (!selectedGame) return null;

  return (
    <div className="w-full h-full flex items-center justify-center bg-[#2a2a2a]">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-10">
          <div className="px-6 py-4 rounded bg-black/60 backdrop-blur-sm border border-gray-600">
            <div className="font-geneva-12 text-white text-sm shimmer flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Loading {selectedGame.name}...
            </div>
          </div>
        </div>
      )}
      <div className="relative">
        <ReactGbaJs
          volume={settings.enableSound ? settings.volume : 0}
          scale={2}
          onFpsReported={(fps: number) => {
            if (settings.showFps) {
              console.log(`FPS: ${fps}`);
            }
          }}
        />
        {settings.showFps && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
            FPS Monitor Active
          </div>
        )}
      </div>
    </div>
  );
}

declare global {
  interface Window {
    gameBoyActions?: {
      saveState: () => void;
      loadState: () => void;
      reset: () => void;
      pause: () => void;
    };
    ARMCoreArm?: any;
    GameBoyAdvance?: any;
  }
}

export function GameBoyAppComponent({
  isWindowOpen,
  onClose,
  isForeground,
  skipInitialSound,
  instanceId,
  onNavigateNext,
  onNavigatePrevious,
}: AppProps) {
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const {
    games,
    currentGame,
    settings,
    setCurrentGame,
    updateSettings,
  } = useGameBoyStore();

  const [selectedGame, setSelectedGame] = useState<GbaGame | null>(() => {
    return currentGame || null;
  });

  const handleLoadGame = (game: GbaGame) => {
    setSelectedGame(game);
    setCurrentGame(game);
  };

  const handleSaveState = () => {
    if (window.gameBoyActions) {
      window.gameBoyActions.saveState();
    }
  };

  const handleLoadState = () => {
    if (window.gameBoyActions) {
      window.gameBoyActions.loadState();
    }
  };

  const handleReset = () => {
    if (window.gameBoyActions) {
      window.gameBoyActions.reset();
    }
    setIsResetDialogOpen(false);
  };

  const handleToggleSound = () => {
    const newSoundEnabled = !settings.enableSound;
    updateSettings({ enableSound: newSoundEnabled });
  };

  const handleToggleFullScreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };

  const handleVolumeChange = (volume: number) => {
    updateSettings({ volume });
  };

  const handleFrameSkipChange = (frameSkip: number) => {
    updateSettings({ frameSkip });
  };

  const handleToggleFpsDisplay = () => {
    const newShowFps = !settings.showFps;
    updateSettings({ showFps: newShowFps });
  };

  if (!isWindowOpen) return null;

  return (
    <GbaProvider>
      <GameBoyMenuBar
        onClose={onClose}
        onShowHelp={() => setIsHelpDialogOpen(true)}
        onShowAbout={() => setIsAboutDialogOpen(true)}
        onSaveState={handleSaveState}
        onLoadState={handleLoadState}
        onReset={() => setIsResetDialogOpen(true)}
        onLoadGame={handleLoadGame}
        selectedGame={selectedGame}
        onToggleSound={handleToggleSound}
        onToggleFullScreen={handleToggleFullScreen}
        onVolumeChange={handleVolumeChange}
        onFrameSkipChange={handleFrameSkipChange}
        onToggleFpsDisplay={handleToggleFpsDisplay}
        settings={settings}
      />
      <WindowFrame
        title="GameBoy Advance"
        onClose={onClose}
        isForeground={isForeground}
        appId="gameboy"
        skipInitialSound={skipInitialSound}
        instanceId={instanceId}
        onNavigateNext={onNavigateNext}
        onNavigatePrevious={onNavigatePrevious}
      >
        <div className="flex flex-col h-full w-full bg-[#2a2a2a]">
          <div className="flex-1 relative h-full">
            {selectedGame ? (
              <GameBoyEmulator
                selectedGame={selectedGame}
                settings={settings}
                onGameLoaded={() => {}}
              />
            ) : (
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="bg-black px-4 py-3 border-b border-[#4a4a4a]">
                  <div className="flex items-center justify-between">
                    <div className="font-apple-garamond text-white text-lg">
                      GameBoy Advance
                    </div>
                    <div className="font-geneva-12 text-gray-400 text-[12px]">
                      {games.length} GAMES AVAILABLE
                    </div>
                  </div>
                </div>

                {/* Game Grid */}
                <div className="flex-1 p-4 overflow-y-auto flex justify-start md:justify-center w-full">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 w-full">
                    {games.map((game) => (
                      <motion.button
                        key={game.id}
                        onClick={() => handleLoadGame(game)}
                        className="group relative aspect-video rounded overflow-hidden bg-[#3a3a3a] hover:bg-[#4a4a4a] transition-all duration-200 shadow-[0_4px_12px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.7)] border border-[#4a4a4a] hover:border-[#5a5a5a] w-full h-full"
                        style={{ aspectRatio: "16/9" }}
                        whileHover={{
                          scale: 1.05,
                          y: -2,
                          transition: {
                            duration: 0.08,
                            ease: "linear",
                          },
                        }}
                        whileTap={{
                          scale: 0.95,
                          y: 0,
                          transition: {
                            type: "spring",
                            duration: 0.15,
                          },
                        }}
                      >
                        <div className="relative w-full h-full">
                          <img
                            src={game.image}
                            alt={game.name}
                            className="w-full h-full object-cover"
                            width={320}
                            height={180}
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                            <div className="text-left">
                              <span className="text-white font-geneva-12 text-[12px] block">
                                {game.name}
                              </span>
                              {game.developer && (
                                <span className="text-gray-300 font-geneva-12 text-[10px]">
                                  {game.developer} • {game.year}
                                </span>
                              )}
                              <span className="text-yellow-300 font-geneva-12 text-[9px] mt-1 block">
                                ROM required for gameplay
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <HelpDialog
          isOpen={isHelpDialogOpen}
          onOpenChange={setIsHelpDialogOpen}
          helpItems={helpItems}
          appName="GameBoy Advance"
        />
        <AboutDialog
          isOpen={isAboutDialogOpen}
          onOpenChange={setIsAboutDialogOpen}
          metadata={appMetadata}
        />
        <ConfirmDialog
          isOpen={isResetDialogOpen}
          onOpenChange={setIsResetDialogOpen}
          onConfirm={handleReset}
          title="Reset Game"
          description="Are you sure you want to reset the current game? Any unsaved progress will be lost."
        />
      </WindowFrame>
    </GbaProvider>
  );
}