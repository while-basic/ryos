/*
----------------------------------------------------------------------------
 File:       CalculatorAppComponent.tsx
 Project:     ryOS
 Created by:  Celaya Solutions, 2025
 Author:      Christopher Celaya <chris@chriscelaya.com>
 Description: Calculator application component
 Version:     1.0.0
 License:     BSL (SPDX id BUSL)
 Last Update: July 2025
----------------------------------------------------------------------------
*/

import { useState, useEffect } from "react";
import { AppProps } from "../../base/types";
import { WindowFrame } from "@/components/layout/WindowFrame";
import { CalculatorMenuBar } from "./CalculatorMenuBar";
import { HelpDialog } from "@/components/dialogs/HelpDialog";
import { AboutDialog } from "@/components/dialogs/AboutDialog";
import { Button } from "@/components/ui/button";
import { helpItems, appMetadata } from "..";
import { useSound, Sounds } from "@/hooks/useSound";
import { useThemeStore } from "@/stores/useThemeStore";
import { cn } from "@/lib/utils";

export function CalculatorAppComponent({
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
  const isMacTheme = currentTheme === "macosx" || currentTheme === "system7";

  // Calculator state
  const [display, setDisplay] = useState("0");
  const [firstOperand, setFirstOperand] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForSecondOperand, setWaitingForSecondOperand] = useState(false);
  const [memory, setMemory] = useState<number>(0);

  // Sound effects
  const { play: playButtonPress } = useSound(Sounds.BUTTON_PRESS);

  // Handle digit input
  const inputDigit = (digit: string) => {
    playButtonPress();
    
    if (waitingForSecondOperand) {
      setDisplay(digit);
      setWaitingForSecondOperand(false);
    } else {
      setDisplay(display === "0" ? digit : display + digit);
    }
  };

  // Handle decimal point
  const inputDecimal = () => {
    playButtonPress();
    
    if (waitingForSecondOperand) {
      setDisplay("0.");
      setWaitingForSecondOperand(false);
      return;
    }
    
    if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  // Handle operators
  const handleOperator = (nextOperator: string) => {
    playButtonPress();
    
    const inputValue = parseFloat(display);
    
    if (firstOperand === null) {
      setFirstOperand(inputValue);
    } else if (operator) {
      const result = performCalculation();
      setDisplay(String(result));
      setFirstOperand(result);
    }
    
    setWaitingForSecondOperand(true);
    setOperator(nextOperator);
  };

  // Perform calculation based on operator
  const performCalculation = (): number => {
    const inputValue = parseFloat(display);
    
    if (firstOperand === null) {
      return inputValue;
    }
    
    switch (operator) {
      case "+":
        return firstOperand + inputValue;
      case "-":
        return firstOperand - inputValue;
      case "×":
        return firstOperand * inputValue;
      case "÷":
        return firstOperand / inputValue;
      default:
        return inputValue;
    }
  };

  // Handle equals
  const handleEquals = () => {
    playButtonPress();
    
    if (firstOperand === null || operator === null) {
      return;
    }
    
    const result = performCalculation();
    setDisplay(String(result));
    setFirstOperand(null);
    setOperator(null);
    setWaitingForSecondOperand(false);
  };

  // Clear the calculator
  const clearCalculator = () => {
    playButtonPress();
    setDisplay("0");
    setFirstOperand(null);
    setOperator(null);
    setWaitingForSecondOperand(false);
  };

  // Toggle positive/negative
  const toggleSign = () => {
    playButtonPress();
    setDisplay(String(parseFloat(display) * -1));
  };

  // Calculate percentage
  const calculatePercentage = () => {
    playButtonPress();
    const currentValue = parseFloat(display);
    
    if (firstOperand === null) {
      setDisplay(String(currentValue / 100));
    } else {
      // If in the middle of an operation, calculate percentage of first operand
      setDisplay(String((currentValue / 100) * firstOperand));
    }
  };

  // Memory functions
  const memoryAdd = () => {
    playButtonPress();
    setMemory(memory + parseFloat(display));
  };

  const memorySubtract = () => {
    playButtonPress();
    setMemory(memory - parseFloat(display));
  };

  const memoryRecall = () => {
    playButtonPress();
    setDisplay(String(memory));
    setWaitingForSecondOperand(true);
  };

  const memoryClear = () => {
    playButtonPress();
    setMemory(0);
  };

  // Menu handlers
  const handleMenuAction = (action: string) => {
    switch (action) {
      case "help":
        setShowHelp(true);
        break;
      case "about":
        setShowAbout(true);
        break;
      case "clear":
        clearCalculator();
        break;
      case "copy":
        navigator.clipboard.writeText(display);
        break;
      case "paste":
        navigator.clipboard.readText().then((text) => {
          const num = parseFloat(text);
          if (!isNaN(num)) {
            setDisplay(String(num));
          }
        });
        break;
      default:
        break;
    }
  };

  // Create the menu bar component
  const menuBar = (
    <CalculatorMenuBar onAction={handleMenuAction} isForeground={isForeground} />
  );

  // Button style based on theme
  const getButtonStyle = (type: "digit" | "operator" | "function" | "equals") => {
    if (isModernTheme) {
      return cn(
        "flex items-center justify-center rounded-md text-lg font-medium transition-colors",
        type === "digit" ? "bg-gray-100 hover:bg-gray-200" : "",
        type === "operator" ? "bg-blue-100 hover:bg-blue-200 text-blue-800" : "",
        type === "function" ? "bg-gray-200 hover:bg-gray-300" : "",
        type === "equals" ? "bg-blue-500 hover:bg-blue-600 text-white" : ""
      );
    }
    
    if (isMacTheme) {
      return cn(
        "flex items-center justify-center rounded text-lg font-medium transition-colors",
        type === "digit" ? "bg-gray-100 hover:bg-gray-200 border border-gray-300" : "",
        type === "operator" ? "bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-300" : "",
        type === "function" ? "bg-gray-200 hover:bg-gray-300 border border-gray-400" : "",
        type === "equals" ? "bg-blue-500 hover:bg-blue-600 text-white border border-blue-700" : ""
      );
    }
    
    if (isXpTheme) {
      return cn(
        "flex items-center justify-center text-lg font-medium transition-colors border-2 border-gray-400 shadow-sm",
        type === "digit" ? "bg-white hover:bg-gray-100" : "",
        type === "operator" ? "bg-blue-100 hover:bg-blue-200" : "",
        type === "function" ? "bg-gray-200 hover:bg-gray-300" : "",
        type === "equals" ? "bg-blue-500 hover:bg-blue-600 text-white" : ""
      );
    }
    
    // Default style
    return cn(
      "flex items-center justify-center text-lg font-medium transition-colors",
      type === "digit" ? "bg-gray-100 hover:bg-gray-200" : "",
      type === "operator" ? "bg-blue-100 hover:bg-blue-200 text-blue-800" : "",
      type === "function" ? "bg-gray-200 hover:bg-gray-300" : "",
      type === "equals" ? "bg-blue-500 hover:bg-blue-600 text-white" : ""
    );
  };

  return (
    <>
      {!isXpTheme && isForeground && menuBar}
      
      <WindowFrame
        title="Calculator"
        onClose={onClose}
        isForeground={isForeground}
        appId="calculator"
        skipInitialSound={skipInitialSound}
        instanceId={instanceId}
        onNavigateNext={onNavigateNext}
        onNavigatePrevious={onNavigatePrevious}
        menuBar={isXpTheme ? menuBar : undefined}
      >
        <div className="flex flex-col h-full p-2 bg-gray-50">
          {/* Display */}
          <div className="mb-2 p-2 bg-white border border-gray-300 rounded text-right text-2xl font-mono h-12 flex items-center justify-end overflow-hidden">
            <div className="truncate">{display}</div>
          </div>
          
          {/* Memory indicator */}
          <div className="flex justify-between mb-2 text-xs text-gray-600">
            <div>{memory !== 0 ? "M" : ""}</div>
            <div>{operator ? `${firstOperand} ${operator}` : ""}</div>
          </div>
          
          {/* Calculator buttons */}
          <div className="grid grid-cols-4 gap-1 flex-grow">
            {/* Row 1 - Memory and Clear */}
            <button 
              className={getButtonStyle("function")}
              onClick={memoryClear}
            >
              MC
            </button>
            <button 
              className={getButtonStyle("function")}
              onClick={memoryRecall}
            >
              MR
            </button>
            <button 
              className={getButtonStyle("function")}
              onClick={memoryAdd}
            >
              M+
            </button>
            <button 
              className={getButtonStyle("function")}
              onClick={memorySubtract}
            >
              M-
            </button>
            
            {/* Row 2 - Clear, Sign, Percentage, Divide */}
            <button 
              className={getButtonStyle("function")}
              onClick={clearCalculator}
            >
              C
            </button>
            <button 
              className={getButtonStyle("function")}
              onClick={toggleSign}
            >
              ±
            </button>
            <button 
              className={getButtonStyle("function")}
              onClick={calculatePercentage}
            >
              %
            </button>
            <button 
              className={getButtonStyle("operator")}
              onClick={() => handleOperator("÷")}
            >
              ÷
            </button>
            
            {/* Row 3 - 7, 8, 9, Multiply */}
            <button 
              className={getButtonStyle("digit")}
              onClick={() => inputDigit("7")}
            >
              7
            </button>
            <button 
              className={getButtonStyle("digit")}
              onClick={() => inputDigit("8")}
            >
              8
            </button>
            <button 
              className={getButtonStyle("digit")}
              onClick={() => inputDigit("9")}
            >
              9
            </button>
            <button 
              className={getButtonStyle("operator")}
              onClick={() => handleOperator("×")}
            >
              ×
            </button>
            
            {/* Row 4 - 4, 5, 6, Subtract */}
            <button 
              className={getButtonStyle("digit")}
              onClick={() => inputDigit("4")}
            >
              4
            </button>
            <button 
              className={getButtonStyle("digit")}
              onClick={() => inputDigit("5")}
            >
              5
            </button>
            <button 
              className={getButtonStyle("digit")}
              onClick={() => inputDigit("6")}
            >
              6
            </button>
            <button 
              className={getButtonStyle("operator")}
              onClick={() => handleOperator("-")}
            >
              -
            </button>
            
            {/* Row 5 - 1, 2, 3, Add */}
            <button 
              className={getButtonStyle("digit")}
              onClick={() => inputDigit("1")}
            >
              1
            </button>
            <button 
              className={getButtonStyle("digit")}
              onClick={() => inputDigit("2")}
            >
              2
            </button>
            <button 
              className={getButtonStyle("digit")}
              onClick={() => inputDigit("3")}
            >
              3
            </button>
            <button 
              className={getButtonStyle("operator")}
              onClick={() => handleOperator("+")}
            >
              +
            </button>
            
            {/* Row 6 - 0, Decimal, Equals */}
            <button 
              className={`${getButtonStyle("digit")} col-span-2`}
              onClick={() => inputDigit("0")}
            >
              0
            </button>
            <button 
              className={getButtonStyle("digit")}
              onClick={inputDecimal}
            >
              .
            </button>
            <button 
              className={getButtonStyle("equals")}
              onClick={handleEquals}
            >
              =
            </button>
          </div>
        </div>
      </WindowFrame>
      
      {/* Dialogs */}
      <HelpDialog
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        title="Calculator Help"
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
