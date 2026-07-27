import React, { createContext, useState, useEffect } from 'react';

export const NavModeContext = createContext();

export const NavModeProvider = ({ children }) => {
  const [activeEventId, setActiveEventId] = useState(() => {
    return localStorage.getItem('cp_nav_event_id') || null;
  });

  const [currentPhase, setCurrentPhase] = useState(() => {
    return localStorage.getItem('cp_nav_phase') || null; // 'outdoor' | 'indoor' | 'arrived' | null
  });

  const [outdoorProgress, setOutdoorProgress] = useState(() => {
    return parseInt(localStorage.getItem('cp_nav_outdoor_progress') || '0');
  });

  const [outdoorStatus, setOutdoorStatus] = useState("Standing at current position");
  
  const [activeIndoorStep, setActiveIndoorStep] = useState(() => {
    return parseInt(localStorage.getItem('cp_nav_active_indoor_step') || '0');
  });

  const [completedIndoorSteps, setCompletedIndoorSteps] = useState(() => {
    const saved = localStorage.getItem('cp_nav_completed_steps');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (activeEventId) localStorage.setItem('cp_nav_event_id', activeEventId);
    else localStorage.removeItem('cp_nav_event_id');
  }, [activeEventId]);

  useEffect(() => {
    if (currentPhase) localStorage.setItem('cp_nav_phase', currentPhase);
    else localStorage.removeItem('cp_nav_phase');
  }, [currentPhase]);

  useEffect(() => {
    localStorage.setItem('cp_nav_outdoor_progress', String(outdoorProgress));
  }, [outdoorProgress]);

  useEffect(() => {
    localStorage.setItem('cp_nav_active_indoor_step', String(activeIndoorStep));
  }, [activeIndoorStep]);

  useEffect(() => {
    localStorage.setItem('cp_nav_completed_steps', JSON.stringify(completedIndoorSteps));
  }, [completedIndoorSteps]);

  const startNavigation = (eventId) => {
    setActiveEventId(eventId);
    setCurrentPhase('outdoor');
    setOutdoorProgress(0);
    setOutdoorStatus("Initializing walking route...");
    setActiveIndoorStep(0);
    setCompletedIndoorSteps([]);
  };

  const simulateArrival = () => {
    setOutdoorProgress(100);
    setOutdoorStatus("Arrived at building boundary!");
    setCurrentPhase('indoor');
    setActiveIndoorStep(0);
    setCompletedIndoorSteps([]);
  };

  const setIndoorStep = (stepIndex) => {
    setActiveIndoorStep(stepIndex);
  };

  const markIndoorStepCompleted = (stepIndex, isCompleted) => {
    setCompletedIndoorSteps((prev) => {
      const next = [...prev];
      next[stepIndex] = isCompleted;
      return next;
    });
  };

  const finishNavigation = () => {
    setCurrentPhase('arrived');
  };

  const resetNavigation = () => {
    setActiveEventId(null);
    setCurrentPhase(null);
    setOutdoorProgress(0);
    setOutdoorStatus("Standing at current position");
    setActiveIndoorStep(0);
    setCompletedIndoorSteps([]);
    localStorage.removeItem('cp_nav_event_id');
    localStorage.removeItem('cp_nav_phase');
    localStorage.removeItem('cp_nav_outdoor_progress');
    localStorage.removeItem('cp_nav_active_indoor_step');
    localStorage.removeItem('cp_nav_completed_steps');
  };

  return (
    <NavModeContext.Provider
      value={{
        activeEventId,
        currentPhase,
        outdoorProgress,
        outdoorStatus,
        activeIndoorStep,
        completedIndoorSteps,
        startNavigation,
        setOutdoorProgress,
        setOutdoorStatus,
        simulateArrival,
        setIndoorStep,
        markIndoorStepCompleted,
        finishNavigation,
        resetNavigation,
      }}
    >
      {children}
    </NavModeContext.Provider>
  );
};
