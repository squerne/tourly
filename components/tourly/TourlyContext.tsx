"use client";
import React, { createContext, useContext, useState, useCallback } from "react";

// Types
import { TourlyContextType } from "./types";

// Example Hooks Usage:
// const { setCurrentStep, closeTourly, startTourly } = useTourly();

// // To trigger a specific step
// setCurrentStep(2); // step 3

// // To close/start onboarding
// closeTourly();
// startTourly();

const TourlyContext = createContext<TourlyContextType | undefined>(undefined);

const useTourly = () => {
  const context = useContext(TourlyContext);
  if (context === undefined) {
    throw new Error("useTourly must be used within an TourlyProvider");
  }
  return context;
};

const TourlyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentTour, setCurrentTour] = useState<string | null>(null);
  const [currentStep, setCurrentStepState] = useState(0);
  const [isTourlyVisible, setTourlyVisible] = useState(false);

  const setCurrentStep = useCallback((step: number, delay?: number) => {
    if (delay) {
      setTimeout(() => {
        setCurrentStepState(step);
        setTourlyVisible(true);
      }, delay);
    } else {
      setCurrentStepState(step);
      setTourlyVisible(true);
    }
  }, []);

  const closeTourly = useCallback(() => {
    setTourlyVisible(false);
    setCurrentTour(null);
  }, []);

  const startTourly = useCallback((tourName: string) => {
    setCurrentTour(tourName);
    setCurrentStepState(0);
    setTourlyVisible(true);
  }, []);

  return (
    <TourlyContext.Provider
      value={{
        currentTour,
        currentStep,
        setCurrentStep,
        closeTourly,
        startTourly,
        isTourlyVisible,
      }}
    >
      {children}
    </TourlyContext.Provider>
  );
};

export { TourlyProvider, useTourly };
