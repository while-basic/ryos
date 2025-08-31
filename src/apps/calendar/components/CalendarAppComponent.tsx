/*
----------------------------------------------------------------------------
 File:       CalendarAppComponent.tsx
 Project:     ryOS
 Created by:  Celaya Solutions, 2025
 Author:      Christopher Celaya <chris@chriscelaya.com>
 Description: Calendar application component
 Version:     1.0.0
 License:     BSL (SPDX id BUSL)
 Last Update: July 2025
----------------------------------------------------------------------------
*/

import { useState, useEffect } from "react";
import { AppProps } from "../../base/types";
import { WindowFrame } from "@/components/layout/WindowFrame";
import { CalendarMenuBar } from "./CalendarMenuBar";
import { HelpDialog } from "@/components/dialogs/HelpDialog";
import { AboutDialog } from "@/components/dialogs/AboutDialog";
import { Button } from "@/components/ui/button";
import { helpItems, appMetadata } from "..";
import { useSound, Sounds } from "@/hooks/useSound";
import { useThemeStore } from "@/stores/useThemeStore";
import { cn } from "@/lib/utils";

// Day type for calendar
interface Day {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasEvent: boolean;
}

// Event type
interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time?: string;
  description?: string;
}

export function CalendarAppComponent({
  isWindowOpen,
  onClose,
  isForeground = true,
  skipInitialSound = false,
  instanceId,
  onNavigateNext,
  onNavigatePrevious,
}: AppProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const { current: currentTheme } = useThemeStore();
  const isXpTheme = currentTheme === "xp" || currentTheme === "win98";
  const isModernTheme = currentTheme === "modern";
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<"month" | "week" | "day">("month");
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: "1",
      title: "Team Meeting",
      date: new Date(new Date().setDate(new Date().getDate() + 2)),
      time: "10:00 AM",
      description: "Weekly team sync-up"
    },
    {
      id: "2",
      title: "Lunch with Alex",
      date: new Date(),
      time: "12:30 PM",
      description: "At Cafe Deluxe"
    },
    {
      id: "3",
      title: "Project Deadline",
      date: new Date(new Date().setDate(new Date().getDate() + 5)),
      description: "Submit final deliverables"
    }
  ]);
  
  // Sound effects
  const { play: playClick } = useSound(Sounds.BUTTON_PRESS);

  // Generate days for the current month view
  const generateDaysForMonthView = (): Day[][] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDayOfMonth = new Date(year, month, 1);
    const dayOfWeek = firstDayOfMonth.getDay();
    
    // Last day of the month
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    
    // Days from previous month to show
    const daysFromPrevMonth = dayOfWeek;
    
    // Last day of previous month
    const lastDayOfPrevMonth = new Date(year, month, 0).getDate();
    
    const today = new Date();
    
    // Generate calendar grid (6 rows x 7 columns)
    const calendarGrid: Day[][] = [];
    let dayCounter = 1;
    let nextMonthCounter = 1;
    
    // Check if a date has an event
    const hasEvent = (date: Date): boolean => {
      return events.some(event => 
        event.date.getDate() === date.getDate() && 
        event.date.getMonth() === date.getMonth() && 
        event.date.getFullYear() === date.getFullYear()
      );
    };
    
    for (let row = 0; row < 6; row++) {
      const week: Day[] = [];
      
      for (let col = 0; col < 7; col++) {
        if (row === 0 && col < daysFromPrevMonth) {
          // Previous month days
          const prevMonthDate = lastDayOfPrevMonth - (daysFromPrevMonth - col - 1);
          const date = new Date(year, month - 1, prevMonthDate);
          week.push({
            date: prevMonthDate,
            isCurrentMonth: false,
            isToday: false,
            hasEvent: hasEvent(date)
          });
        } else if (dayCounter <= daysInMonth) {
          // Current month days
          const date = new Date(year, month, dayCounter);
          week.push({
            date: dayCounter,
            isCurrentMonth: true,
            isToday: 
              dayCounter === today.getDate() && 
              month === today.getMonth() && 
              year === today.getFullYear(),
            hasEvent: hasEvent(date)
          });
          dayCounter++;
        } else {
          // Next month days
          const date = new Date(year, month + 1, nextMonthCounter);
          week.push({
            date: nextMonthCounter,
            isCurrentMonth: false,
            isToday: false,
            hasEvent: hasEvent(date)
          });
          nextMonthCounter++;
        }
      }
      
      calendarGrid.push(week);
      
      // If we've already processed all days and filled the grid, break
      if (dayCounter > daysInMonth && row >= 4) {
        break;
      }
    }
    
    return calendarGrid;
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    playClick();
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Navigate to next month
  const goToNextMonth = () => {
    playClick();
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Navigate to today
  const goToToday = () => {
    playClick();
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };

  // Handle date selection
  const selectDate = (date: number, isCurrentMonth: boolean) => {
    playClick();
    let newDate;
    
    if (isCurrentMonth) {
      newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), date);
    } else {
      // If selecting a date from previous/next month, adjust the month accordingly
      if (date > 20) {
        // Previous month
        newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, date);
      } else {
        // Next month
        newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, date);
      }
    }
    
    setSelectedDate(newDate);
  };

  // Get events for selected date
  const getEventsForSelectedDate = (): CalendarEvent[] => {
    return events.filter(event => 
      event.date.getDate() === selectedDate.getDate() && 
      event.date.getMonth() === selectedDate.getMonth() && 
      event.date.getFullYear() === selectedDate.getFullYear()
    );
  };

  // Format date to display in header
  const formatMonthYear = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Handle menu actions
  const handleMenuAction = (action: string) => {
    switch (action) {
      case "help":
        setShowHelp(true);
        break;
      case "about":
        setShowAbout(true);
        break;
      case "today":
        goToToday();
        break;
      case "month":
        setCurrentView("month");
        break;
      case "week":
        setCurrentView("week");
        break;
      case "day":
        setCurrentView("day");
        break;
      default:
        break;
    }
  };

  // Create the menu bar component
  const menuBar = (
    <CalendarMenuBar 
      onAction={handleMenuAction} 
      isForeground={isForeground}
      currentView={currentView}
    />
  );

  // Generate calendar grid
  const calendarGrid = generateDaysForMonthView();
  const selectedDateEvents = getEventsForSelectedDate();

  // Day of week headers
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <>
      {!isXpTheme && isForeground && menuBar}
      
      <WindowFrame
        title="Calendar"
        onClose={onClose}
        isForeground={isForeground}
        appId="calendar"
        skipInitialSound={skipInitialSound}
        instanceId={instanceId}
        onNavigateNext={onNavigateNext}
        onNavigatePrevious={onNavigatePrevious}
        menuBar={isXpTheme ? menuBar : undefined}
      >
        <div className="flex flex-col h-full bg-white">
          {/* Calendar Header */}
          <div className="flex justify-between items-center p-4 border-b">
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToPreviousMonth}
                className="h-8 w-8 p-0"
              >
                ←
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToNextMonth}
                className="h-8 w-8 p-0"
              >
                →
              </Button>
              <h2 className="text-lg font-semibold ml-2">
                {formatMonthYear(currentDate)}
              </h2>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToToday}
              >
                Today
              </Button>
              
              <div className="flex border rounded overflow-hidden">
                <Button 
                  variant={currentView === "month" ? "default" : "ghost"} 
                  size="sm" 
                  onClick={() => handleMenuAction("month")}
                  className="rounded-none"
                >
                  Month
                </Button>
                <Button 
                  variant={currentView === "week" ? "default" : "ghost"} 
                  size="sm" 
                  onClick={() => handleMenuAction("week")}
                  className="rounded-none"
                >
                  Week
                </Button>
                <Button 
                  variant={currentView === "day" ? "default" : "ghost"} 
                  size="sm" 
                  onClick={() => handleMenuAction("day")}
                  className="rounded-none"
                >
                  Day
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex flex-1 overflow-hidden">
            {/* Main Calendar View */}
            <div className="flex-1 overflow-auto">
              {currentView === "month" && (
                <div className="h-full">
                  {/* Day of week headers */}
                  <div className="grid grid-cols-7 text-center py-2 border-b">
                    {weekDays.map((day, index) => (
                      <div 
                        key={index} 
                        className={cn(
                          "text-sm font-medium",
                          (index === 0 || index === 6) ? "text-red-500" : "text-gray-700"
                        )}
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Calendar grid */}
                  <div className="flex-1">
                    {calendarGrid.map((week, rowIndex) => (
                      <div key={rowIndex} className="grid grid-cols-7 border-b">
                        {week.map((day, colIndex) => (
                          <div
                            key={`${rowIndex}-${colIndex}`}
                            className={cn(
                              "min-h-[80px] p-1 border-r last:border-r-0 relative",
                              day.isCurrentMonth ? "bg-white" : "bg-gray-50",
                              selectedDate.getDate() === day.date && 
                              selectedDate.getMonth() === (day.isCurrentMonth ? currentDate.getMonth() : 
                                (day.date > 20 ? currentDate.getMonth() - 1 : currentDate.getMonth() + 1)) && 
                              selectedDate.getFullYear() === currentDate.getFullYear() ? 
                                "ring-2 ring-blue-500 ring-inset" : ""
                            )}
                            onClick={() => selectDate(day.date, day.isCurrentMonth)}
                          >
                            <div 
                              className={cn(
                                "text-right font-medium text-sm mb-1",
                                !day.isCurrentMonth ? "text-gray-400" : "",
                                day.isToday ? "bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center ml-auto" : "",
                                (colIndex === 0 || colIndex === 6) && day.isCurrentMonth ? "text-red-500" : ""
                              )}
                            >
                              {day.isToday ? (
                                <span className="mx-auto">{day.date}</span>
                              ) : (
                                day.date
                              )}
                            </div>
                            
                            {/* Event indicators */}
                            {day.hasEvent && (
                              <div className="absolute bottom-1 left-1 right-1">
                                <div className="h-1 bg-blue-500 rounded-full"></div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {currentView === "week" && (
                <div className="p-4 text-center">
                  <p>Week view coming soon</p>
                </div>
              )}
              
              {currentView === "day" && (
                <div className="p-4 text-center">
                  <p>Day view coming soon</p>
                </div>
              )}
            </div>
            
            {/* Event sidebar */}
            <div className="w-64 border-l p-4 overflow-y-auto">
              <h3 className="font-medium mb-2">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </h3>
              
              {selectedDateEvents.length > 0 ? (
                <div className="space-y-2">
                  {selectedDateEvents.map(event => (
                    <div 
                      key={event.id} 
                      className="p-2 bg-blue-50 border border-blue-100 rounded"
                    >
                      <div className="font-medium">{event.title}</div>
                      {event.time && <div className="text-sm text-gray-600">{event.time}</div>}
                      {event.description && (
                        <div className="text-sm mt-1">{event.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No events for this day</p>
              )}
              
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => playClick()}
                >
                  Add Event
                </Button>
              </div>
            </div>
          </div>
        </div>
      </WindowFrame>
      
      {/* Dialogs */}
      <HelpDialog
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        title="Calendar Help"
        items={helpItems}
      />
      
      <AboutDialog
        isOpen={showAbout}
        onClose={() => setShowAbout(false)}
        metadata={appMetadata}
      />
    </>
  );
}
