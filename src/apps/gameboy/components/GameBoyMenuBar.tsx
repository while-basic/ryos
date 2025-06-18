import { Button } from "@/components/ui/button";
import { MenuBar } from "@/components/layout/MenuBar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { GbaGame, loadGbaGames } from "@/stores/useGameBoyStore";
import { toast } from "sonner";
import { generateAppShareUrl } from "@/utils/sharedUrl";

interface GameBoyMenuBarProps {
  onClose: () => void;
  onShowHelp: () => void;
  onShowAbout: () => void;
  onSaveState: () => void;
  onLoadState: () => void;
  onReset: () => void;
  onLoadGame: (game: GbaGame) => void;
  selectedGame: GbaGame | null;
  onToggleSound: () => void;
  onToggleFullScreen: () => void;
  onVolumeChange: (volume: number) => void;
  onFrameSkipChange: (frameSkip: number) => void;
  onToggleFpsDisplay: () => void;
  settings: {
    volume: number;
    enableSound: boolean;
    frameSkip: number;
    showFps: boolean;
    enableRewind: boolean;
  };
}

export function GameBoyMenuBar({
  onClose,
  onShowHelp,
  onShowAbout,
  onSaveState,
  onLoadState,
  onReset,
  onLoadGame,
  selectedGame,
  onToggleSound,
  onToggleFullScreen,
  onVolumeChange,
  onFrameSkipChange,
  onToggleFpsDisplay,
  settings,
}: GameBoyMenuBarProps) {
  const availableGames = loadGbaGames();
  const volumeOptions = [0.0, 0.25, 0.5, 0.75, 1.0];
  const frameSkipOptions = [0, 1, 2, 3, 4];

  return (
    <MenuBar>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="default"
            className="h-6 text-md px-2 py-1 border-none hover:bg-gray-200 active:bg-gray-900 active:text-white focus-visible:ring-0"
          >
            File
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={1} className="px-0">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="text-md h-6 px-3 active:bg-gray-900 active:text-white">
              Load Game
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="px-0">
              {availableGames.map((game) => (
                <DropdownMenuItem
                  key={game.id}
                  onClick={() => onLoadGame(game)}
                  className={`text-md h-6 px-3 active:bg-gray-900 active:text-white ${
                    selectedGame?.id === game.id ? "bg-gray-100" : ""
                  }`}
                >
                  {game.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator className="h-[2px] bg-black my-1" />
          <DropdownMenuItem
            onClick={onSaveState}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
            disabled={!selectedGame}
          >
            Save State
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onLoadState}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
            disabled={!selectedGame}
          >
            Load State
          </DropdownMenuItem>
          <DropdownMenuSeparator className="h-[2px] bg-black my-1" />
          <DropdownMenuItem
            onClick={onReset}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
            disabled={!selectedGame}
          >
            Reset Game
          </DropdownMenuItem>
          <DropdownMenuSeparator className="h-[2px] bg-black my-1" />
          <DropdownMenuItem
            onClick={onClose}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            Close
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="default"
            className="h-6 px-2 py-1 text-md focus-visible:ring-0 hover:bg-gray-200 active:bg-gray-900 active:text-white"
          >
            Options
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={1} className="px-0">
          <DropdownMenuItem
            onClick={onToggleFullScreen}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            Full Screen
          </DropdownMenuItem>
          <DropdownMenuSeparator className="h-[2px] bg-black my-1" />
          <DropdownMenuItem
            onClick={onToggleSound}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            {settings.enableSound ? "Mute Sound" : "Enable Sound"}
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="text-md h-6 px-3 active:bg-gray-900 active:text-white">
              Volume
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="px-0">
              {volumeOptions.map((volume) => (
                <DropdownMenuItem
                  key={volume}
                  onClick={() => onVolumeChange(volume)}
                  className={`text-md h-6 px-3 active:bg-gray-900 active:text-white ${
                    settings.volume === volume ? "bg-gray-100" : ""
                  }`}
                >
                  {Math.round(volume * 100)}%
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator className="h-[2px] bg-black my-1" />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="text-md h-6 px-3 active:bg-gray-900 active:text-white">
              Frame Skip
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="px-0">
              {frameSkipOptions.map((skip) => (
                <DropdownMenuItem
                  key={skip}
                  onClick={() => onFrameSkipChange(skip)}
                  className={`text-md h-6 px-3 active:bg-gray-900 active:text-white ${
                    settings.frameSkip === skip ? "bg-gray-100" : ""
                  }`}
                >
                  {skip === 0 ? "None" : `${skip} frames`}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem
            onClick={onToggleFpsDisplay}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            {settings.showFps ? "Hide FPS" : "Show FPS"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="default"
            className="h-6 px-2 py-1 text-md focus-visible:ring-0 hover:bg-gray-200 active:bg-gray-900 active:text-white"
          >
            Help
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={1} className="px-0">
          <DropdownMenuItem
            onClick={onShowHelp}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            GameBoy Help
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={async () => {
              const appId = "gameboy";
              const shareUrl = generateAppShareUrl(appId);
              if (!shareUrl) return;
              try {
                await navigator.clipboard.writeText(shareUrl);
                toast.success("App link copied!", {
                  description: `Link to ${appId} copied to clipboard.`,
                });
              } catch (err) {
                console.error("Failed to copy app link: ", err);
                toast.error("Failed to copy link", {
                  description: "Could not copy link to clipboard.",
                });
              }
            }}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            Share App...
          </DropdownMenuItem>
          <DropdownMenuSeparator className="h-[2px] bg-black my-1" />
          <DropdownMenuItem
            onClick={onShowAbout}
            className="text-md h-6 px-3 active:bg-gray-900 active:text-white"
          >
            About GameBoy
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </MenuBar>
  );
}