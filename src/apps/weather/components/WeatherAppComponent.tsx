/*
----------------------------------------------------------------------------
 File:       WeatherAppComponent.tsx
 Project:     ryOS
 Created by:  Celaya Solutions, 2025
 Author:      Christopher Celaya <chris@chriscelaya.com>
 Description: Weather application component
 Version:     1.0.0
 License:     BSL (SPDX id BUSL)
 Last Update: July 2025
----------------------------------------------------------------------------
*/

import { useState, useEffect } from "react";
import { AppProps } from "../../base/types";
import { WindowFrame } from "@/components/layout/WindowFrame";
import { WeatherMenuBar } from "./WeatherMenuBar";
import { HelpDialog } from "@/components/dialogs/HelpDialog";
import { AboutDialog } from "@/components/dialogs/AboutDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { helpItems, appMetadata } from "..";
import { useSound, Sounds } from "@/hooks/useSound";
import { useThemeStore } from "@/stores/useThemeStore";
import { cn } from "@/lib/utils";

// Weather data types
interface WeatherCondition {
  main: string;
  description: string;
  icon: string;
}

interface WeatherData {
  city: string;
  country: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  condition: WeatherCondition;
  forecast: DailyForecast[];
}

interface DailyForecast {
  day: string;
  high: number;
  low: number;
  condition: WeatherCondition;
}

// Mock weather data
const mockWeatherData: WeatherData = {
  city: "San Francisco",
  country: "US",
  temperature: 68,
  feelsLike: 70,
  humidity: 65,
  windSpeed: 8,
  condition: {
    main: "Clear",
    description: "clear sky",
    icon: "01d"
  },
  forecast: [
    {
      day: "Mon",
      high: 70,
      low: 58,
      condition: { main: "Clear", description: "clear sky", icon: "01d" }
    },
    {
      day: "Tue",
      high: 72,
      low: 60,
      condition: { main: "Clouds", description: "few clouds", icon: "02d" }
    },
    {
      day: "Wed",
      high: 68,
      low: 59,
      condition: { main: "Clouds", description: "scattered clouds", icon: "03d" }
    },
    {
      day: "Thu",
      high: 65,
      low: 57,
      condition: { main: "Rain", description: "light rain", icon: "10d" }
    },
    {
      day: "Fri",
      high: 67,
      low: 56,
      condition: { main: "Clouds", description: "broken clouds", icon: "04d" }
    }
  ]
};

// Alternative locations
const savedLocations = [
  { city: "San Francisco", country: "US" },
  { city: "New York", country: "US" },
  { city: "London", country: "UK" },
  { city: "Tokyo", country: "JP" },
  { city: "Sydney", country: "AU" }
];

export function WeatherAppComponent({
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
  
  // Weather state
  const [weatherData, setWeatherData] = useState<WeatherData>(mockWeatherData);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("current");
  const [isLoading, setIsLoading] = useState(false);
  const [unit, setUnit] = useState<"f" | "c">("f");
  
  // Sound effects
  const { play: playClick } = useSound(Sounds.BUTTON_PRESS);

  // Convert temperature based on selected unit
  const formatTemp = (temp: number): string => {
    if (unit === "c") {
      return `${Math.round((temp - 32) * 5 / 9)}°C`;
    }
    return `${Math.round(temp)}°F`;
  };

  // Get weather icon based on condition
  const getWeatherIcon = (iconCode: string): string => {
    // Map icon codes to emoji for simplicity
    const iconMap: Record<string, string> = {
      "01d": "☀️", // clear sky day
      "01n": "🌙", // clear sky night
      "02d": "⛅", // few clouds day
      "02n": "☁️", // few clouds night
      "03d": "☁️", // scattered clouds
      "03n": "☁️", // scattered clouds
      "04d": "☁️", // broken clouds
      "04n": "☁️", // broken clouds
      "09d": "🌧️", // shower rain
      "09n": "🌧️", // shower rain
      "10d": "🌦️", // rain day
      "10n": "🌧️", // rain night
      "11d": "⛈️", // thunderstorm
      "11n": "⛈️", // thunderstorm
      "13d": "❄️", // snow
      "13n": "❄️", // snow
      "50d": "🌫️", // mist
      "50n": "🌫️", // mist
    };
    
    return iconMap[iconCode] || "🌤️";
  };

  // Handle search
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    playClick();
    setIsLoading(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      // For demo, just update the city name and keep the same data
      setWeatherData({
        ...weatherData,
        city: searchQuery,
        country: "US" // Default to US for demo
      });
      setIsLoading(false);
      setSearchQuery("");
    }, 1000);
  };

  // Handle location selection
  const selectLocation = (city: string, country: string) => {
    playClick();
    setIsLoading(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      setWeatherData({
        ...weatherData,
        city,
        country
      });
      setIsLoading(false);
    }, 800);
  };

  // Toggle temperature unit
  const toggleUnit = () => {
    playClick();
    setUnit(unit === "f" ? "c" : "f");
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
      case "refresh":
        handleRefresh();
        break;
      case "toggle_unit":
        toggleUnit();
        break;
      default:
        break;
    }
  };

  // Refresh weather data
  const handleRefresh = () => {
    playClick();
    setIsLoading(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      // For demo, just keep the same data
      setIsLoading(false);
    }, 1000);
  };

  // Create the menu bar component
  const menuBar = (
    <WeatherMenuBar 
      onAction={handleMenuAction} 
      isForeground={isForeground}
      unit={unit}
    />
  );

  return (
    <>
      {!isXpTheme && isForeground && menuBar}
      
      <WindowFrame
        title="Weather"
        onClose={onClose}
        isForeground={isForeground}
        appId="weather"
        skipInitialSound={skipInitialSound}
        instanceId={instanceId}
        onNavigateNext={onNavigateNext}
        onNavigatePrevious={onNavigatePrevious}
        menuBar={isXpTheme ? menuBar : undefined}
      >
        <div className="flex flex-col h-full bg-white">
          {/* Search Bar */}
          <div className="p-4 border-b">
            <div className="flex gap-2">
              <Input
                placeholder="Search location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={isLoading}>
                {isLoading ? "..." : "Search"}
              </Button>
            </div>
          </div>
          
          {/* Main Content */}
          <Tabs 
            defaultValue="current" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col"
          >
            <div className="border-b px-4">
              <TabsList>
                <TabsTrigger value="current" onClick={() => playClick()}>Current</TabsTrigger>
                <TabsTrigger value="forecast" onClick={() => playClick()}>Forecast</TabsTrigger>
                <TabsTrigger value="locations" onClick={() => playClick()}>Locations</TabsTrigger>
              </TabsList>
            </div>
            
            {/* Current Weather Tab */}
            <TabsContent value="current" className="flex-1 p-0 m-0">
              <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <h2 className="text-2xl font-semibold mb-1">
                  {weatherData.city}, {weatherData.country}
                </h2>
                
                <div className="text-7xl my-4 flex items-center justify-center">
                  <span className="text-6xl mr-2">
                    {getWeatherIcon(weatherData.condition.icon)}
                  </span>
                  {formatTemp(weatherData.temperature)}
                </div>
                
                <div className="text-lg mb-4">
                  {weatherData.condition.main}
                </div>
                
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-left">
                  <div className="text-gray-600">Feels like:</div>
                  <div>{formatTemp(weatherData.feelsLike)}</div>
                  
                  <div className="text-gray-600">Humidity:</div>
                  <div>{weatherData.humidity}%</div>
                  
                  <div className="text-gray-600">Wind:</div>
                  <div>{weatherData.windSpeed} mph</div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="mt-6"
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  {isLoading ? "Updating..." : "Refresh"}
                </Button>
              </div>
            </TabsContent>
            
            {/* Forecast Tab */}
            <TabsContent value="forecast" className="flex-1 p-0 m-0">
              <div className="h-full p-4">
                <h2 className="text-lg font-semibold mb-4">
                  5-Day Forecast for {weatherData.city}
                </h2>
                
                <div className="grid grid-cols-5 gap-2">
                  {weatherData.forecast.map((day, index) => (
                    <div 
                      key={index}
                      className="border rounded-lg p-3 text-center"
                    >
                      <div className="font-medium">{day.day}</div>
                      <div className="text-3xl my-2">
                        {getWeatherIcon(day.condition.icon)}
                      </div>
                      <div className="font-medium">{formatTemp(day.high)}</div>
                      <div className="text-gray-500">{formatTemp(day.low)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            {/* Locations Tab */}
            <TabsContent value="locations" className="flex-1 p-0 m-0">
              <div className="h-full p-4">
                <h2 className="text-lg font-semibold mb-4">
                  Saved Locations
                </h2>
                
                <div className="space-y-2">
                  {savedLocations.map((location, index) => (
                    <div 
                      key={index}
                      className={cn(
                        "p-3 border rounded-lg cursor-pointer hover:bg-gray-50",
                        location.city === weatherData.city && 
                        location.country === weatherData.country ? 
                          "bg-blue-50 border-blue-200" : ""
                      )}
                      onClick={() => selectLocation(location.city, location.country)}
                    >
                      <div className="font-medium">
                        {location.city}, {location.country}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4">
                  <Button variant="outline" size="sm">
                    Add Current Location
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Status Bar */}
          <div className="border-t p-2 px-4 flex justify-between text-sm text-gray-500">
            <div>Last updated: {new Date().toLocaleTimeString()}</div>
            <div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2"
                onClick={toggleUnit}
              >
                {unit === "f" ? "°F" : "°C"}
              </Button>
            </div>
          </div>
        </div>
      </WindowFrame>
      
      {/* Dialogs */}
      <HelpDialog
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        title="Weather Help"
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
