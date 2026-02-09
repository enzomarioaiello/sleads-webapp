"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search } from "lucide-react";
import { countries, Country } from "@/app/utils/countries";
import { useApp } from "@/app/contexts/AppContext";

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function PhoneInput({
  value = "",
  onChange,
  className,
  placeholder,
}: PhoneInputProps) {
  const { t } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter countries based on search query
  const filteredCountries = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return countries.filter((country) => {
      const name = t(`contact.countries.${country.code}`).toLowerCase();
      const code = country.dial_code.toLowerCase();
      return name.includes(query) || code.includes(query);
    });
  }, [searchQuery, t]);

  useEffect(() => {
    // Attempt to parse initial value if provided
    if (value) {
      // Simple heuristic to find country code
      const country = countries.find((c) => value.startsWith(c.dial_code));
      if (country) {
        setSelectedCountry(country);
        setPhoneNumber(value.slice(country.dial_code.length).trim());
      } else {
        setPhoneNumber(value);
      }
    }
  }, []); // Only run once on mount for initial value

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Focus search input when dropdown opens
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      // Reset search when dropdown closes
      setSearchQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    if (onChange) {
      onChange(`${country.dial_code} ${phoneNumber}`);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumber = e.target.value.replace(/[^0-9\s]/g, ""); // Allow spaces
    setPhoneNumber(newNumber);
    if (onChange) {
      onChange(`${selectedCountry.dial_code} ${newNumber}`);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="flex items-center border-b border-slate-300 dark:border-sleads-slate700 py-2 transition-all focus-within:border-sleads-blue">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 mr-3 focus:outline-none"
        >
          <span className="text-xl leading-none">{selectedCountry.flag}</span>
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {selectedCountry.dial_code}
          </span>
          <ChevronDown
            className={`w-3 h-3 text-slate-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        <input
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneChange}
          className="w-full bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400/50 focus:outline-none"
          placeholder={placeholder || "123 456 789"}
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 w-64 max-h-60 flex flex-col mt-1 bg-white dark:bg-sleads-midnight border border-slate-200 dark:border-sleads-slate700 rounded-lg shadow-xl overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-slate-100 dark:border-sleads-slate700 bg-slate-50/50 dark:bg-sleads-slate900/30 sticky top-0 backdrop-blur-sm">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search country..."
                className="w-full bg-white dark:bg-sleads-midnight border border-slate-200 dark:border-sleads-slate700 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-sleads-blue transition-colors"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Country List */}
          <div className="overflow-y-auto custom-scrollbar flex-1">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-slate-50 dark:hover:bg-sleads-slate900/50 transition-colors ${
                    selectedCountry.code === country.code
                      ? "bg-slate-50 dark:bg-sleads-slate900/50 text-sleads-blue"
                      : "text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <span className="text-xl leading-none">{country.flag}</span>
                  <span className="flex-1 truncate">
                    {t(`contact.countries.${country.code}`)}
                  </span>
                  <span className="text-slate-400 text-xs">
                    {country.dial_code}
                  </span>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-xs text-slate-400 text-center">
                No countries found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

