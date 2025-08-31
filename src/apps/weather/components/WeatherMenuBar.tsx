/*
----------------------------------------------------------------------------
 File:       WeatherMenuBar.tsx
 Project:     ryOS
 Created by:  Celaya Solutions, 2025
 Author:      Christopher Celaya <chris@chriscelaya.com>
 Description: Weather application menu bar
 Version:     1.0.0
 License:     BSL (SPDX id BUSL)
 Last Update: July 2025
----------------------------------------------------------------------------
*/

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
  MenubarCheckboxItem,
} from "@/components/ui/menubar";

interface WeatherMenuBarProps {
  onAction: (action: string) => void;
  isForeground?: boolean;
  unit: "f" | "c";
}

export function WeatherMenuBar({ 
  onAction, 
  isForeground = true,
  unit 
}: WeatherMenuBarProps) {
  return (
    <Menubar className="rounded-none border-b border-none h-7 px-2 lg:px-3">
      <MenubarMenu>
        <MenubarTrigger className="font-medium">File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => onAction("add_location")}>
            Add Location<MenubarShortcut>⌘N</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={() => onAction("refresh")}>
            Refresh<MenubarShortcut>⌘R</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={() => onAction("about")}>About Weather</MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={() => onAction("close")}>
            Close<MenubarShortcut>⌘W</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="font-medium">View</MenubarTrigger>
        <MenubarContent>
          <MenubarCheckboxItem 
            checked={unit === "f"}
            onClick={() => onAction("toggle_unit")}
          >
            Fahrenheit (°F)
          </MenubarCheckboxItem>
          <MenubarCheckboxItem 
            checked={unit === "c"}
            onClick={() => onAction("toggle_unit")}
          >
            Celsius (°C)
          </MenubarCheckboxItem>
          <MenubarSeparator />
          <MenubarItem onClick={() => onAction("show_radar")}>
            Show Radar Map
          </MenubarItem>
          <MenubarItem onClick={() => onAction("show_alerts")}>
            Show Weather Alerts
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="font-medium">Locations</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => onAction("add_location")}>
            Add Location
          </MenubarItem>
          <MenubarItem onClick={() => onAction("manage_locations")}>
            Manage Locations
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={() => onAction("use_current_location")}>
            Use Current Location
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="font-medium">Help</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => onAction("help")}>
            Weather Help<MenubarShortcut>?</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
