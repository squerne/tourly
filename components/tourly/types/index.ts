import { Transition } from "framer-motion";

// Context
export interface TourlyContextType {
  currentStep: number;
  currentTour: string | null;
  setCurrentStep: (step: number, delay?: number) => void;
  closeTourly: () => void;
  startTourly: (tourName: string) => void;
  isTourlyVisible: boolean;
}

// Step
export interface Step {
  // Step Content
  icon?: React.ReactNode | string | null;
  title: string;
  content: React.ReactNode;
  selector: string;
  // Options
  side?: "top" | "bottom" | "left" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right" | "left-top" | "left-bottom" | "right-top" | "right-bottom";
  showControls?: boolean;
  pointerPadding?: number;
  pointerRadius?: number;
  // Routing
  nextRoute?: string;
  prevRoute?: string;
}

// Tour
// 
export interface Tour {
  tour: string;
  steps: Step[];
}

// Tourly
export interface TourlyProps {
  children: React.ReactNode;
  interact?: boolean;
  steps: Tour[];
  showTourly?: boolean;
  shadowRgb?: string;
  shadowOpacity?: string;
  cardTransition?: Transition;
  cardComponent?: React.ComponentType<CardComponentProps>;
}

// Custom Card
export interface CardComponentProps {
  step: Step;
  currentStep: number;
  totalSteps: number;
  nextStep: () => void;
  prevStep: () => void;
  arrow: React.ReactNode;
}
