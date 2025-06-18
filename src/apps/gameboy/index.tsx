import { BaseApp } from "../base/types";
import { GameBoyAppComponent } from "./components/GameBoyAppComponent";

export const appMetadata = {
  name: "GameBoy Advance",
  version: "1.0.0",
  creator: {
    name: "Ryo",
    url: "https://github.com/ryokun6",
  },
  github: "https://github.com/ryokun6/ryos",
  icon: "/icons/gameboy.png",
};

export const helpItems = [
  {
    icon: "🎮",
    title: "GBA Emulator",
    description: "Play classic Game Boy Advance games in your browser",
  },
  {
    icon: "⌨️",
    title: "Controls",
    description: "Arrow keys: D-pad, Z/X: A/B buttons, A/S: L/R buttons, Enter: Start, Shift: Select",
  },
  {
    icon: "🔊",
    title: "Audio Settings",
    description: "Adjust volume and toggle sound from the Options menu",
  },
  {
    icon: "⛶",
    title: "Full Screen",
    description: "Use Options → Full Screen for immersive gameplay",
  },
  {
    icon: "💾",
    title: "Save States",
    description: "Save and load your game progress from the File menu",
  },
  {
    icon: "⚡",
    title: "Performance",
    description: "Adjust frame skip and toggle FPS display for optimal performance",
  },
];

export const GameBoyApp: BaseApp = {
  id: "gameboy",
  name: "GameBoy Advance",
  icon: { type: "image", src: "/icons/gameboy.png" },
  description: "GBA Emulator",
  component: GameBoyAppComponent,
  windowConstraints: {
    minWidth: 640,
    minHeight: 480,
  },
  helpItems,
  metadata: appMetadata,
};