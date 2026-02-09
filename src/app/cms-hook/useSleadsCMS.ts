"use client";
import {
  useState,
  useCallback,
  useRef,
  useEffect,
  createContext,
  useContext,
  ReactNode,
  createElement,
} from "react";
import { usePathname } from "next/navigation";

interface SleadsCMSField {
  id: string;
  value: string | number | boolean | null | undefined;
  // Store full field data for language switching
  defaultValue?: string;
  values?: Record<string, string | null>;
}

interface FetchedCMSField {
  fieldId: string;
  key: string;
  defaultValue: string;
  values: Record<string, string | null>;
}

function transformFetchedFields(
  fetchedFields: Array<FetchedCMSField>,
  currentLang: string,
): Array<SleadsCMSField> {
  const language = currentLang || "en";

  return fetchedFields.map((field) => ({
    id: field.key,
    defaultValue: field.defaultValue,
    values: field.values,
    value:
      field.values[language] !== null && field.values[language] !== undefined
        ? field.values[language]
        : field.defaultValue,
  }));
}

interface CachedData<T> {
  data: T;
  timestamp: number;
}

interface SleadsCMSLanguageContextType {
  languages: string[];
  selectedLanguage: string;
  isLoadingLanguages: boolean;
  setLanguage: (language: string) => void;
}

const SleadsCMSLanguageContext =
  createContext<SleadsCMSLanguageContextType | null>(null);

const SLEADS_CMS_BASE_URL = "https://elegant-cheetah-861.convex.site"; //deployment URL
const PROJECT_ID = "jx71e542y494xq534p8z6a9f5n7xvf52";
const SLEADS_CMS_API_KEY = process.env.NEXT_PUBLIC_SLEADS_CMS_API_KEY;

// Cache expiration: 30 days in milliseconds
const CACHE_EXPIRATION_MS = 30 * 24 * 60 * 60 * 1000;
const CACHE_KEY_LANGUAGES = `sleads_cms_languages_${PROJECT_ID}`;
const CACHE_KEY_FIELDS_PREFIX = `sleads_cms_fields_${PROJECT_ID}_`;

function getCachedData<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const parsed: CachedData<T> = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is expired
    if (now - parsed.timestamp > CACHE_EXPIRATION_MS) {
      localStorage.removeItem(key);
      return null;
    }

    return parsed.data;
  } catch (error) {
    console.error("Error reading from cache:", error);
    return null;
  }
}

function setCachedData<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;

  try {
    const cached: CachedData<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(cached));
  } catch (error) {
    console.error("Error writing to cache:", error);
  }
}

// Provider component to wrap the app and share language state
export function SleadsCMSLanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [languages, setLanguages] = useState<string[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    const cachedLanguages = getCachedData<string[]>(CACHE_KEY_LANGUAGES);
    if (cachedLanguages && cachedLanguages.length > 0) {
      return cachedLanguages;
    }

    return [];
  });
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    if (typeof window === "undefined") {
      return "en";
    }

    const cachedLanguages = getCachedData<string[]>(CACHE_KEY_LANGUAGES);
    const languagesFromCache =
      cachedLanguages && cachedLanguages.length > 0 ? cachedLanguages : null;

    const savedLanguage = localStorage.getItem("selectedLanguage");
    if (
      savedLanguage &&
      languagesFromCache &&
      languagesFromCache.includes(savedLanguage)
    ) {
      return savedLanguage;
    }

    if (languagesFromCache && languagesFromCache.length > 0) {
      return languagesFromCache[0];
    }

    return "en";
  });

  // Effect for fetching languages - runs once on mount
  useEffect(() => {
    // Helper to set languages and selected language
    const applyLanguages = (languageList: string[]) => {
      setLanguages(languageList);
      if (typeof window !== "undefined") {
        const savedLanguage = localStorage.getItem("selectedLanguage");
        if (savedLanguage && languageList.includes(savedLanguage)) {
          setSelectedLanguage(savedLanguage);
        } else {
          setSelectedLanguage(languageList[0]);
        }
      } else {
        setSelectedLanguage(languageList[0]);
      }
    };

    // Try to load from cache first (defer to avoid synchronous setState in effect)
    const cachedLanguages = getCachedData<string[]>(CACHE_KEY_LANGUAGES);
    if (
      cachedLanguages &&
      cachedLanguages.length > 0 &&
      languages.length === 0
    ) {
      queueMicrotask(() => applyLanguages(cachedLanguages));
      // Don't show loading indicator since we have cached data
    } else {
      queueMicrotask(() => setIsLoadingLanguages(true));
    }

    // Always fetch fresh data in the background
    const fetchLanguages = async () => {
      try {
        const response = await fetch(
          `${SLEADS_CMS_BASE_URL}/cms/get-languages/${PROJECT_ID}`,
        );
        const data = (await response.json()) as {
          languages?: string[];
        };
        if (data.languages) {
          // Update cache
          setCachedData(CACHE_KEY_LANGUAGES, data.languages);
          // Apply new languages
          applyLanguages(data.languages);
        }
        setIsLoadingLanguages(false);
      } catch (error) {
        console.error("Failed to fetch languages:", error);
        setIsLoadingLanguages(false);
      }
    };

    fetchLanguages();
  }, []);

  const setLanguage = useCallback(
    (language: string) => {
      if (!languages.includes(language)) {
        return;
      }

      if (language === selectedLanguage) {
        return;
      }

      // Save to localStorage for persistence across sessions
      if (typeof window !== "undefined") {
        localStorage.setItem("selectedLanguage", language);
      }

      // Update selectedLanguage state - all consumers will re-render
      setSelectedLanguage(language);
    },
    [languages, selectedLanguage],
  );

  return createElement(
    SleadsCMSLanguageContext.Provider,
    {
      value: {
        languages,
        selectedLanguage,
        isLoadingLanguages,
        setLanguage,
      },
    },
    children,
  );
}

// Hook to access language context
export function useSleadsCMSLanguage() {
  const context = useContext(SleadsCMSLanguageContext);
  if (!context) {
    throw new Error(
      "useSleadsCMSLanguage must be used within a SleadsCMSLanguageProvider",
    );
  }
  return context;
}

export default function useSleadsCMS(overridePathname?: string | null) {
  const pathname = usePathname();
  const page = overridePathname ? overridePathname : pathname || "";

  // Get shared language state from context
  const { languages, selectedLanguage, isLoadingLanguages, setLanguage } =
    useSleadsCMSLanguage();

  // Read search params directly from URL to avoid Suspense boundary requirement
  // Initialize as undefined to avoid SSR issues
  const [splitId, setSplitId] = useState<string | undefined>(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const params = new URLSearchParams(window.location.search);
    return params.get("splitId") || undefined;
  });
  const [hasRegistered, setHasRegistered] = useState(false);
  const splitIdRef = useRef<string | undefined>(undefined);

  // Update splitId when pathname or URL search params change (client-side only)
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Use requestAnimationFrame to defer state update and avoid synchronous setState warning
    const updateSplitId = () => {
      const params = new URLSearchParams(window.location.search);
      const newSplitId = params.get("splitId") || undefined;

      // Only update if value actually changed to avoid unnecessary re-renders
      if (splitIdRef.current !== newSplitId) {
        splitIdRef.current = newSplitId;
        setSplitId(newSplitId);
      }
    };

    // Defer to next frame to avoid synchronous setState
    const rafId = requestAnimationFrame(updateSplitId);
    return () => cancelAnimationFrame(rafId);
  }, [pathname]);
  const [fields, setFields] = useState<Array<SleadsCMSField> | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const params = new URLSearchParams(window.location.search);
    const initialSplitId = params.get("splitId") || undefined;

    const fetchKey = `${page}-${initialSplitId || "default"}`;
    const cacheKey = `${CACHE_KEY_FIELDS_PREFIX}${fetchKey}`;

    const cachedFields = getCachedData<Array<FetchedCMSField>>(cacheKey);
    if (cachedFields && cachedFields.length > 0) {
      // Hydrate initial fields from cache to avoid flashing defaults
      return transformFetchedFields(cachedFields, selectedLanguage || "en");
    }

    return null;
  });

  const fieldsRef = useRef<Array<SleadsCMSField> | null>(null);
  const initializedFields = useRef<Set<string>>(new Set());
  const hasFetchedRef = useRef<string>(""); // Track if we've fetched for this page/splitId combo
  const hasRegisteredRef = useRef<boolean>(false); // Track if we've registered
  const selectedLanguageRef = useRef<string>(selectedLanguage);

  // Keep refs in sync with state
  useEffect(() => {
    fieldsRef.current = fields;
  }, [fields]);

  useEffect(() => {
    selectedLanguageRef.current = selectedLanguage;
  }, [selectedLanguage]);

  const getRegisterStatus = async () => {
    if (
      typeof window === "undefined" ||
      !window.location.hostname.includes("localhost")
    ) {
      return false;
    }

    const response = await fetch(
      `${SLEADS_CMS_BASE_URL}/cms/listening-mode/${PROJECT_ID}`,
    );

    const data = await response.json();

    if (data.listeningMode) {
      alert("Listening mode is enabled");
    }
    return data.listeningMode ?? false;
  };

  // Helper to transform fetched fields to internal format
  const transformFields = useCallback(
    (fetchedFields: Array<FetchedCMSField>): Array<SleadsCMSField> => {
      const currentLang = selectedLanguageRef.current || "en";
      return transformFetchedFields(fetchedFields, currentLang);
    },
    [],
  );

  // Helper to merge fields with existing fields
  const mergeFields = useCallback(
    (
      prevFields: Array<SleadsCMSField> | null,
      newFields: Array<SleadsCMSField>,
    ): Array<SleadsCMSField> => {
      if (!prevFields) {
        return newFields;
      }

      const fetchedMap = new Map<string, SleadsCMSField>(
        newFields.map((field) => [field.id, field]),
      );

      const updatedFields = [...prevFields];
      fetchedMap.forEach((fetchedField, id) => {
        const existingIndex = updatedFields.findIndex((f) => f.id === id);
        if (existingIndex >= 0) {
          updatedFields[existingIndex] = fetchedField;
        } else {
          updatedFields.push(fetchedField);
        }
      });

      return updatedFields;
    },
    [],
  );

  // Effect for fetching fields - only runs when page or splitId changes
  // Note: selectedLanguage is accessed via ref to avoid unnecessary re-fetches
  useEffect(() => {
    const fetchKey = `${page}-${splitId || "default"}`;
    const cacheKey = `${CACHE_KEY_FIELDS_PREFIX}${fetchKey}`;

    // Reset fetch tracking if page or splitId changed
    if (hasFetchedRef.current !== fetchKey) {
      hasFetchedRef.current = ""; // Reset to allow fetching
    }

    // Skip if we've already fetched for this page/splitId combination
    if (hasFetchedRef.current === fetchKey) {
      return;
    }

    // Try to load from cache first (defer to avoid synchronous setState in effect)
    const cachedFields = getCachedData<Array<FetchedCMSField>>(cacheKey);
    if (cachedFields && cachedFields.length > 0) {
      const transformedFields = transformFields(cachedFields);
      queueMicrotask(() =>
        setFields((prevFields) => mergeFields(prevFields, transformedFields)),
      );
    }

    // Always fetch fresh data in the background
    setTimeout(async () => {
      // Fetch fields from API
      const getFields = await fetch(
        `${SLEADS_CMS_BASE_URL}/cms/get-fields/?projectId=${PROJECT_ID}&pageId=${page}&splitId=${splitId}`,
      );
      const data = (await getFields.json()) as {
        fields?: Array<FetchedCMSField>;
      };
      if (data.fields) {
        // Update cache with raw fetched data
        setCachedData(cacheKey, data.fields);

        // Transform and merge fields
        const transformedFields = transformFields(data.fields);
        setFields((prevFields) => mergeFields(prevFields, transformedFields));
      }

      // Mark as fetched for this combination
      hasFetchedRef.current = fetchKey;
    });
  }, [page, splitId, transformFields, mergeFields]);

  // Separate effect for registration - only runs when fields change and we're in listening mode
  useEffect(() => {
    if (
      hasRegisteredRef.current ||
      !fields ||
      fields.length === 0 ||
      hasRegistered
    ) {
      return;
    }

    const registerFields = async () => {
      const isListening = await getRegisterStatus();

      if (
        isListening &&
        SLEADS_CMS_API_KEY &&
        fieldsRef.current &&
        !hasRegistered
      ) {
        // make call to register fields and page.
        setHasRegistered(true);

        const response = await fetch(`${SLEADS_CMS_BASE_URL}/cms/register`, {
          method: "POST",
          body: JSON.stringify({
            projectId: PROJECT_ID,
            page,
            fields: fieldsRef.current.map((field) => ({
              id: field.id,
              value: field.value,
            })),
            apiKey: SLEADS_CMS_API_KEY,
          }),
        });

        const data = await response.json();
        if (data.success) {
          alert("Fields registered successfully");
          hasRegisteredRef.current = true;
        } else {
          alert("Failed to register fields");
        }
      }
    };

    // Debounce registration to avoid multiple calls
    const timeoutId = setTimeout(registerFields, 500);
    return () => clearTimeout(timeoutId);
  }, []);

  const c = useCallback(
    (
      id: string,
      defaultValue: string | number | boolean | null | undefined,
    ) => {
      // Check if field already exists in state (either from previous c() call or from fetched data)
      const existingField = fields?.find((field) => field.id === id);

      // If field exists, return value based on selected language
      if (existingField) {
        // Mark as initialized if not already
        if (!initializedFields.current.has(id)) {
          initializedFields.current.add(id);
        }

        // Always check language values first - this ensures language switching works immediately
        if (existingField.values && selectedLanguage) {
          const langValue = existingField.values[selectedLanguage];
          // If language value exists (not null/undefined), use it
          if (
            langValue !== null &&
            langValue !== undefined &&
            langValue !== ""
          ) {
            return langValue;
          }
        }

        // Fall back to defaultValue if no language-specific value exists
        // Use existingField.defaultValue if available, otherwise use the passed defaultValue
        return existingField.defaultValue ?? defaultValue;
      }

      // Field doesn't exist yet - add it to state with defaultValue (for registration)
      // Mark as initialized
      initializedFields.current.add(id);

      setFields((prevFields) => {
        const newField: SleadsCMSField = {
          id,
          value: defaultValue,
          defaultValue:
            typeof defaultValue === "string" ? defaultValue : undefined,
        };

        if (!prevFields) {
          return [newField];
        }

        // Don't add if it already exists (shouldn't happen, but safety check)
        const alreadyExists = prevFields.find((field) => field.id === id);
        if (alreadyExists) {
          return prevFields;
        }

        return [...prevFields, newField];
      });

      // Return defaultValue immediately so there's a value shown right away
      return defaultValue;
    },
    [fields, selectedLanguage], // Include fields and selectedLanguage so c updates when either changes
  );

  const showFieldsAlert = () => {
    alert(fieldsRef.current?.map((field) => field.id).join(", "));
  };

  return {
    c,
    getRegisterStatus,
    showFieldsAlert,
    languages,
    isLoadingLanguages,
    setLanguage,
    selectedLanguage,
  };
}
