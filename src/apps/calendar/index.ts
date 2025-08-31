/*
----------------------------------------------------------------------------
 File:       index.ts
 Project:     ryOS
 Created by:  Celaya Solutions, 2025
 Author:      Christopher Celaya <chris@chriscelaya.com>
 Description: Calendar application entry point
 Version:     1.0.0
 License:     BSL (SPDX id BUSL)
 Last Update: July 2025
----------------------------------------------------------------------------
*/

import { BaseApp } from "../base/types";
import { CalendarAppComponent } from "./components/CalendarAppComponent";

export const appMetadata: BaseApp["metadata"] = {
  name: "Calendar",
  version: "1.0.0",
  creator: {
    name: "Christopher Celaya",
    url: "https://chriscelaya.com",
  },
  github: "https://github.com/ryokun6/ryos",
  icon: "/icons/default/calendar.png",
};

export const helpItems: BaseApp["helpItems"] = [
  {
    icon: "📅",
    title: "Calendar Views",
    description:
      "Switch between Month, Week, and Day views using the buttons at the top of the calendar.",
  },
  {
    icon: "🔍",
    title: "Navigation",
    description:
      "Use the arrows to navigate between months. Click 'Today' to return to the current date.",
  },
  {
    icon: "📝",
    title: "Events",
    description:
      "View events for a specific day by clicking on that day in the calendar. Events will appear in the sidebar.",
  },
  {
    icon: "➕",
    title: "Adding Events",
    description:
      "Click 'Add Event' in the sidebar or use File > New Event to create a new calendar event.",
  },
];

export const CalendarApp: BaseApp = {
  id: "calendar",
  name: "Calendar",
  icon: { type: "image", src: "/icons/default/calendar.png" },
  description: "Manage your schedule and events",
  component: CalendarAppComponent,
  helpItems,
  metadata: appMetadata,
};
