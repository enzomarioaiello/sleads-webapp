"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { translations, Language } from "../utils/translations";

type Route = "home" | "signin" | "signup" | "contact";

interface AppContextType {
  theme: "light" | "dark";
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string) => string;
  route: Route;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [language, setLanguage] = useState<Language>("nl");
  const [route, setRoute] = useState<Route>("home");

  // Load saved preferences
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark";
    if (savedTheme) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(savedTheme);
    } else {
      // Default to light mode
      setTheme("light");
    }

    const savedLang = localStorage.getItem("language") as Language;
    if (savedLang) {
      setLanguage(savedLang);
    } else {
      // Default to Dutch
      setLanguage("nl");
    }
  }, []);

  // Apply theme class to html element
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Save language preference
  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Helper to get nested translation keys (e.g., "nav.work")
  const t = (path: string): string => {
    const keys = path.split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = translations[language];

    if (!current) {
      console.error(`Translations not found for language: ${language}`);
      return path;
    }

    for (const key of keys) {
      if (current === null || current === undefined) {
        console.warn(
          `Translation path broken at: ${path} in language: ${language}`
        );
        return path;
      }
      if (current[key] === undefined) {
        console.warn(
          `Translation missing for key: ${path} in language: ${language}. Available keys at this level: ${Object.keys(current).join(", ")}`
        );
        return path;
      }
      current = current[key];
    }

    if (typeof current !== "string") {
      console.warn(
        `Translation value is not a string for key: ${path} in language: ${language}. Type: ${typeof current}`
      );
      return path;
    }

    return current as string;
  };

  return (
    <AppContext.Provider
      value={{ theme, toggleTheme, language, setLanguage, t, route }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
