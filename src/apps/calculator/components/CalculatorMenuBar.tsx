/*
----------------------------------------------------------------------------
 File:       CalculatorMenuBar.tsx
 Project:     ryOS
 Created by:  Celaya Solutions, 2025
 Author:      Christopher Celaya <chris@chriscelaya.com>
 Description: Calculator application menu bar
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
} from "@/components/ui/menubar";

interface CalculatorMenuBarProps {
  onAction: (action: string) => void;
  isForeground?: boolean;
}

export function CalculatorMenuBar({ onAction, isForeground = true }: CalculatorMenuBarProps) {
  return (
    <Menubar className="rounded-none border-b border-none h-7 px-2 lg:px-3">
      <MenubarMenu>
        <MenubarTrigger className="font-medium">File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => onAction("copy")}>
            Copy<MenubarShortcut>⌘C</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={() => onAction("paste")}>
            Paste<MenubarShortcut>⌘V</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={() => onAction("about")}>About Calculator</MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={() => onAction("close")}>
            Close<MenubarShortcut>⌘W</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="font-medium">Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => onAction("clear")}>
            Clear<MenubarShortcut>⌘Delete</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={() => onAction("copy")}>
            Copy<MenubarShortcut>⌘C</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={() => onAction("paste")}>
            Paste<MenubarShortcut>⌘V</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="font-medium">View</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Basic</MenubarItem>
          <MenubarItem>Scientific</MenubarItem>
          <MenubarItem>Programmer</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="font-medium">Help</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => onAction("help")}>
            Calculator Help<MenubarShortcut>?</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
