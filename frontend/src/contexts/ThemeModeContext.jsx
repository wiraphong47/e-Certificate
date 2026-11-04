import { createContext, useContext } from "react";

export const ThemeModeContext = createContext({ mode: "dark", toggleTheme: () => {} });

export function useThemeMode() {
  return useContext(ThemeModeContext);
}
