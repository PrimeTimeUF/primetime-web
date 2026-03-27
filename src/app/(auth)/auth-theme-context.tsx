"use client";

import { createContext, useContext } from "react";

interface AuthThemeContextValue {
  isDark: boolean;
  toggle: () => void;
}

export const AuthThemeContext = createContext<AuthThemeContextValue>({
  isDark: true,
  toggle: () => {},
});

export function useAuthTheme() {
  return useContext(AuthThemeContext);
}
