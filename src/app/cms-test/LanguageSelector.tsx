"use client";

import React, { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, Loader2, Check } from "lucide-react";
import useSleadsCMS from "../cms-hook/useSleadsCMS";

// Language metadata mapping
const LANGUAGE_METADATA: Record<string, { name: string; flag: string }> = {
  en: { name: "English", flag: "🇬🇧" },
  zh: { name: "Mandarin Chinese", flag: "🇨🇳" },
  hi: { name: "Hindi", flag: "🇮🇳" },
  es: { name: "Spanish", flag: "🇪🇸" },
  fr: { name: "French", flag: "🇫🇷" },
  ar: { name: "Arabic", flag: "🇸🇦" },
  bn: { name: "Bengali", flag: "🇧🇩" },
  pt: { name: "Portuguese", flag: "🇵🇹" },
  ru: { name: "Russian", flag: "🇷🇺" },
  ja: { name: "Japanese", flag: "🇯🇵" },
  de: { name: "German", flag: "🇩🇪" },
  ko: { name: "Korean", flag: "🇰🇷" },
  vi: { name: "Vietnamese", flag: "🇻🇳" },
  it: { name: "Italian", flag: "🇮🇹" },
  tr: { name: "Turkish", flag: "🇹🇷" },
  pl: { name: "Polish", flag: "🇵🇱" },
  uk: { name: "Ukrainian", flag: "🇺🇦" },
  nl: { name: "Dutch", flag: "🇳🇱" },
  th: { name: "Thai", flag: "🇹🇭" },
  id: { name: "Indonesian", flag: "🇮🇩" },
  cs: { name: "Czech", flag: "🇨🇿" },
  sv: { name: "Swedish", flag: "🇸🇪" },
  ro: { name: "Romanian", flag: "🇷🇴" },
  hu: { name: "Hungarian", flag: "🇭🇺" },
  fi: { name: "Finnish", flag: "🇫🇮" },
  da: { name: "Danish", flag: "🇩🇰" },
  no: { name: "Norwegian", flag: "🇳🇴" },
  he: { name: "Hebrew", flag: "🇮🇱" },
  el: { name: "Greek", flag: "🇬🇷" },
  sk: { name: "Slovak", flag: "🇸🇰" },
};

export default function LanguageSelector() {
  const { languages, isLoadingLanguages, selectedLanguage, setLanguage } =
    useSleadsCMS();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Get current language metadata
  const currentLang = selectedLanguage
    ? LANGUAGE_METADATA[selectedLanguage]
    : null;

  // Filter and sort available languages
  const availableLanguages = languages
    .filter((code) => LANGUAGE_METADATA[code])
    .map((code) => ({
      code,
      ...LANGUAGE_METADATA[code],
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (isLoadingLanguages) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-sleads-slate800 rounded-lg border border-gray-200 dark:border-sleads-slate700 shadow-sm">
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500 dark:text-sleads-slate400">
          Loading languages...
        </span>
      </div>
    );
  }

  if (availableLanguages.length === 0) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-sleads-slate800 rounded-lg border border-gray-200 dark:border-sleads-slate700">
        <Globe className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-500 dark:text-sleads-slate400">
          No languages available
        </span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Language Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-sleads-slate800 rounded-lg border transition-all shadow-sm hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md ${
          isOpen
            ? "border-blue-500 dark:border-blue-400 shadow-md"
            : "border-gray-200 dark:border-sleads-slate700"
        }`}
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {/*  */}
        {currentLang && (
          <>
            <span className="text-lg">{currentLang.flag}</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {currentLang.name}
            </span>
            <span className="text-xs text-gray-500 dark:text-sleads-slate400">
              ({selectedLanguage.toUpperCase()})
            </span>
          </>
        )}
        <ChevronDown
          className={`w-4 h-4 text-gray-400 dark:text-sleads-slate500 transition-transform ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-sleads-slate800 rounded-lg border border-gray-200 dark:border-sleads-slate700 shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="p-2">
            {availableLanguages.map((lang) => {
              const isSelected = lang.code === selectedLanguage;
              return (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all text-left hover:bg-blue-50 dark:hover:bg-sleads-slate700 ${
                    isSelected
                      ? "bg-blue-50 dark:bg-sleads-slate700 border border-blue-200 dark:border-blue-700"
                      : ""
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        isSelected
                          ? "text-blue-900 dark:text-blue-100"
                          : "text-gray-900 dark:text-white"
                      }`}
                    >
                      {lang.name}
                    </p>
                    <p
                      className={`text-xs truncate ${
                        isSelected
                          ? "text-blue-700 dark:text-blue-300"
                          : "text-gray-500 dark:text-sleads-slate400"
                      }`}
                    >
                      {lang.code.toUpperCase()}
                    </p>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
