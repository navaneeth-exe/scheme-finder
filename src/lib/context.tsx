"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { UserProfile } from "@/lib/types";
import { demoUser } from "@/lib/seed";

interface AppContextValue {
  userId: string | null;
  profile: UserProfile | null;
  isDemoMode: boolean;
  setProfile: (p: UserProfile) => void;
  enableDemoMode: () => void;
  disableDemoMode: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const DEMO_PROFILE: UserProfile = {
  ...demoUser,
  caste_category: demoUser.caste_category,
};

const STORAGE_KEY = "saturnx_user_id";
const DEMO_KEY = "saturnx_demo_mode";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    const storedDemo = localStorage.getItem(DEMO_KEY);
    if (storedDemo === "true") {
      setIsDemoMode(true);
      setUserId(demoUser.id);
      setProfileState(DEMO_PROFILE);
      return;
    }
    const storedId = localStorage.getItem(STORAGE_KEY);
    if (storedId) setUserId(storedId);
  }, []);

  const setProfile = useCallback((p: UserProfile) => {
    setProfileState(p);
    setUserId(p.id);
    localStorage.setItem(STORAGE_KEY, p.id);
  }, []);

  const enableDemoMode = useCallback(() => {
    setIsDemoMode(true);
    setUserId(demoUser.id);
    setProfileState(DEMO_PROFILE);
    localStorage.setItem(DEMO_KEY, "true");
    localStorage.setItem(STORAGE_KEY, demoUser.id);
  }, []);

  const disableDemoMode = useCallback(() => {
    setIsDemoMode(false);
    setUserId(null);
    setProfileState(null);
    localStorage.removeItem(DEMO_KEY);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AppContext.Provider value={{ userId, profile, isDemoMode, setProfile, enableDemoMode, disableDemoMode }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
