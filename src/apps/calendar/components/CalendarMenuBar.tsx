/*
----------------------------------------------------------------------------
 File:       CalendarMenuBar.tsx
 Project:     ryOS
 Created by:  Celaya Solutions, 2025
 Author:      Christopher Celaya <chris@chriscelaya.com>
 Description: Calendar application menu bar
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

interface CalendarMenuBarProps {
  onAction: (action: string) => void;
  isForeground?: boolean;
  currentView: "month" | "week" | "day";
}

export function CalendarMenuBar({ 
  onAction, 
  isForeground = true,
  currentView 
}: CalendarMenuBarProps) {
  return (
    <Menubar className="rounded-none border-b border-none h-7 px-2 lg:px-3">
      <MenubarMenu>
        <MenubarTrigger className="font-medium">File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => onAction("new_event")}>
            New Event<MenubarShortcut>⌘N</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={() => onAction("print")}>
            Print<MenubarShortcut>⌘P</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={() => onAction("import")}>
            Import Events...
          </MenubarItem>
          <MenubarItem onClick={() => onAction("export")}>
            Export Events...
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={() => onAction("about")}>About Calendar</MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={() => onAction("close")}>
            Close<MenubarShortcut>⌘W</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="font-medium">Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => onAction("undo")}>
            Undo<MenubarShortcut>⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={() => onAction("cut")}>
            Cut<MenubarShortcut>⌘X</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={() => onAction("copy")}>
            Copy<MenubarShortcut>⌘C</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={() => onAction("paste")}>
            Paste<MenubarShortcut>⌘V</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={() => onAction("find")}>
            Find Events...<MenubarShortcut>⌘F</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="font-medium">View</MenubarTrigger>
        <MenubarContent>
          <MenubarCheckboxItem 
            checked={currentView === "day"}
            onClick={() => onAction("day")}
          >
            Day
          </MenubarCheckboxItem>
          <MenubarCheckboxItem 
            checked={currentView === "week"}
            onClick={() => onAction("week")}
          >
            Week
          </MenubarCheckboxItem>
          <MenubarCheckboxItem 
            checked={currentView === "month"}
            onClick={() => onAction("month")}
          >
            Month
          </MenubarCheckboxItem>
          <MenubarSeparator />
          <MenubarItem onClick={() => onAction("today")}>
            Go to Today<MenubarShortcut>⌘T</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={() => onAction("goto_date")}>
            Go to Date...<MenubarShortcut>⌘G</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="font-medium">Help</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => onAction("help")}>
            Calendar Help<MenubarShortcut>?</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
