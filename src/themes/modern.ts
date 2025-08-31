/*
----------------------------------------------------------------------------
 File:       modern.ts
 Project:     ryOS
 Created by:  Celaya Solutions, 2025
 Author:      Christopher Celaya <chris@chriscelaya.com>
 Description: Modern OS theme with flat design, subtle shadows, and rounded corners
 Version:     1.0.0
 License:     BSL (SPDX id BUSL)
 Last Update: July 2025
----------------------------------------------------------------------------
*/

import { OsTheme } from "./types";

export const modern: OsTheme = {
  id: "modern",
  name: "Modern",
  fonts: {
    ui: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "JetBrains Mono, SF Mono, Menlo, monospace",
  },
  colors: {
    windowBg: "#f8f9fa",
    menubarBg: "rgba(248, 249, 250, 0.85)",
    menubarBorder: "rgba(0, 0, 0, 0.06)",
    windowBorder: "rgba(0, 0, 0, 0.08)",
    windowBorderInactive: "rgba(0, 0, 0, 0.04)",
    titleBar: {
      activeBg: "rgba(248, 249, 250, 0.85)",
      inactiveBg: "rgba(248, 249, 250, 0.7)",
      text: "#1a1a1a",
      inactiveText: "#8e8e8e",
      border: "rgba(0, 0, 0, 0.05)",
      borderInactive: "rgba(0, 0, 0, 0.03)",
      borderBottom: "rgba(0, 0, 0, 0.05)",
    },
    button: {
      face: "#ffffff",
      highlight: "rgba(255, 255, 255, 0.9)",
      shadow: "rgba(0, 0, 0, 0.1)",
      activeFace: "#f0f0f0",
    },
    trafficLights: {
      close: "#ff5f57",
      closeHover: "#ff3b30",
      minimize: "#ffbd2e",
      minimizeHover: "#ffb700",
      maximize: "#28c840",
      maximizeHover: "#00b900",
    },
    selection: {
      bg: "#007aff",
      text: "#ffffff",
    },
    text: {
      primary: "#1a1a1a",
      secondary: "#6e6e6e",
      disabled: "#aeaeae",
    },
  },
  metrics: {
    borderWidth: "1px",
    radius: "0.75rem",
    titleBarHeight: "2.25rem",
    titleBarRadius: "0.75rem",
    windowShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
  },
  wallpaperDefaults: {
    photo: "photos/modern-landscape.jpg",
    tile: "tiles/subtle-pattern.png",
    video: "videos/abstract-flow.mp4",
  },
};
