/*
----------------------------------------------------------------------------
 File:       index.ts
 Project:     ryOS
 Created by:  Celaya Solutions, 2025
 Author:      Christopher Celaya <chris@chriscelaya.com>
 Description: Calculator application entry point
 Version:     1.0.0
 License:     BSL (SPDX id BUSL)
 Last Update: July 2025
----------------------------------------------------------------------------
*/

import { BaseApp } from "../base/types";
import { CalculatorAppComponent } from "./components/CalculatorAppComponent";

export const appMetadata: BaseApp["metadata"] = {
  name: "Calculator",
  version: "1.0.0",
  creator: {
    name: "Christopher Celaya",
    url: "https://chriscelaya.com",
  },
  github: "https://github.com/ryokun6/ryos",
  icon: "/icons/default/calculator.png",
};

export const helpItems: BaseApp["helpItems"] = [
  {
    icon: "🧮",
    title: "Basic Operations",
    description:
      "Perform addition, subtraction, multiplication, and division with the calculator.",
  },
  {
    icon: "🔢",
    title: "Memory Functions",
    description:
      "Use MC (Memory Clear), MR (Memory Recall), M+ (Memory Add), and M- (Memory Subtract) to work with stored values.",
  },
  {
    icon: "📋",
    title: "Copy & Paste",
    description:
      "Copy the current value or paste a number using the Edit menu or keyboard shortcuts (⌘C, ⌘V).",
  },
  {
    icon: "🔄",
    title: "Special Functions",
    description:
      "Use ± to change sign, % for percentage calculations, and C to clear the display.",
  },
];

export const CalculatorApp: BaseApp = {
  id: "calculator",
  name: "Calculator",
  icon: { type: "image", src: "/icons/default/calculator.png" },
  description: "Perform basic arithmetic calculations",
  component: CalculatorAppComponent,
  helpItems,
  metadata: appMetadata,
};
