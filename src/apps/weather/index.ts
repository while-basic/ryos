/*
----------------------------------------------------------------------------
 File:       index.ts
 Project:     ryOS
 Created by:  Celaya Solutions, 2025
 Author:      Christopher Celaya <chris@chriscelaya.com>
 Description: Weather application entry point
 Version:     1.0.0
 License:     BSL (SPDX id BUSL)
 Last Update: July 2025
----------------------------------------------------------------------------
*/

import { BaseApp } from "../base/types";
import { WeatherAppComponent } from "./components/WeatherAppComponent";

export const appMetadata: BaseApp["metadata"] = {
  name: "Weather",
  version: "1.0.0",
  creator: {
    name: "Christopher Celaya",
    url: "https://chriscelaya.com",
  },
  github: "https://github.com/ryokun6/ryos",
  icon: "/icons/default/weather.png",
};

export const helpItems: BaseApp["helpItems"] = [
  {
    icon: "🔍",
    title: "Search Locations",
    description:
      "Use the search bar to find weather information for any city around the world.",
  },
  {
    icon: "📊",
    title: "Weather Tabs",
    description:
      "Switch between Current conditions, 5-day Forecast, and saved Locations using the tabs.",
  },
  {
    icon: "🌡️",
    title: "Temperature Units",
    description:
      "Toggle between Fahrenheit and Celsius using the button in the status bar or from the View menu.",
  },
  {
    icon: "🔄",
    title: "Refresh Data",
    description:
      "Click the Refresh button or use File > Refresh to update the weather information.",
  },
];

export const WeatherApp: BaseApp = {
  id: "weather",
  name: "Weather",
  icon: { type: "image", src: "/icons/default/weather.png" },
  description: "Check weather conditions and forecasts",
  component: WeatherAppComponent,
  helpItems,
  metadata: appMetadata,
};
