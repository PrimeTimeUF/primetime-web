"use client";

import { createContext, useContext } from "react";

interface DashboardThemeContextValue {
  isDark: boolean;
  toggle: () => void;
}

export const DashboardThemeContext = createContext<DashboardThemeContextValue>({
  isDark: true,
  toggle: () => {},
});

export function useDashboardTheme() {
  return useContext(DashboardThemeContext);
}
