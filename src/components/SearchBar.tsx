"use client";

import { Search, Loader2 } from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { validateAddress } from "@/lib/validation";
import { normalizeAddressKey, readCache, writeCache } from "@/lib/clientCache";
import type { AddressSuggestion } from "@/app/api/suggest/route";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (address: string) => void;
  isLoading: boolean;
}

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 300;
const SUGGEST_CACHE_TTL_MS = 30 * 60 * 1000;

export function SearchBar({ value: address, onChange, onSubmit, isLoading }: SearchBarProps) {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const listboxId = useId();

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  function scheduleSuggestionFetch(query: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();

    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const cacheKey = `suggest:${normalizeAddressKey(trimmed)}`;
    const cached = readCache<AddressSuggestion[]>(cacheKey);
    if (cached) {
      setSuggestions(cached);
      setActiveIndex(-1);
      setIsOpen(cached.length > 0);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const response = await fetch(`/api/suggest?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = await response.json();
        const results: AddressSuggestion[] = Array.isArray(data?.suggestions) ? data.suggestions : [];
        writeCache(cacheKey, results, SUGGEST_CACHE_TTL_MS);
        setSuggestions(results);
        setActiveIndex(-1);
        setIsOpen(results.length > 0);
      } catch {
        // A suggestion fetch that's aborted (superseded by newer typing) or
        // fails outright just leaves the dropdown as-is — typeahead is a
        // convenience, not something worth surfacing an error for.
      }
    }, DEBOUNCE_MS);
  }

  function handleChange(value: string) {
    onChange(value);
    if (validationError) setValidationError(null);
    scheduleSuggestionFetch(value);
  }

  function selectSuggestion(suggestion: AddressSuggestion) {
    onChange(suggestion.formattedAddress);
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    if (validationError) setValidationError(null);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (event.key === "Enter") {
      if (activeIndex >= 0) {
        event.preventDefault();
        selectSuggestion(suggestions[activeIndex]);
      } else {
        setIsOpen(false);
      }
    } else if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isLoading) return;

    setIsOpen(false);

    const trimmed = address.trim();
    const error = validateAddress(trimmed);
    if (error) {
      setValidationError(error);
      return;
    }

    onSubmit(trimmed);
  }

  return (
    <div className="w-full" ref={containerRef}>
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex w-full flex-col gap-3 rounded-2xl border border-border-subtle bg-surface p-2 shadow-[var(--shadow-soft)] transition-shadow duration-300 focus-within:shadow-[var(--shadow-soft-hover)] sm:flex-row sm:items-center sm:p-2"
      >
        <div className="relative flex flex-1 items-center gap-3 px-3 py-2.5">
          <Search aria-hidden="true" className="h-4.5 w-4.5 shrink-0 text-foreground/50" strokeWidth={2} />
          <label htmlFor={`${listboxId}-input`} className="sr-only">
            Address
          </label>
          <input
            id={`${listboxId}-input`}
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
            value={address}
            onChange={(event) => handleChange(event.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) setIsOpen(true);
            }}
            placeholder="Enter an address..."
            aria-invalid={validationError ? true : undefined}
            aria-describedby={validationError ? "search-address-error" : undefined}
            autoComplete="off"
            className="w-full rounded-md bg-transparent text-[15px] text-foreground placeholder:text-foreground/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          />
          {isOpen && suggestions.length > 0 && (
            <ul
              id={listboxId}
              role="listbox"
              className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-auto rounded-xl border border-border-subtle bg-surface py-1.5 shadow-[var(--shadow-soft-hover)]"
            >
              {suggestions.map((suggestion, index) => (
                <li
                  key={`${suggestion.lat}-${suggestion.lng}-${index}`}
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    selectSuggestion(suggestion);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`cursor-pointer truncate px-4 py-2 text-sm ${
                    index === activeIndex ? "bg-primary/10 text-foreground" : "text-foreground/75"
                  }`}
                >
                  {suggestion.formattedAddress}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              Analyzing…
            </>
          ) : (
            "Analyze"
          )}
        </button>
      </form>
      {validationError && (
        <p id="search-address-error" role="alert" className="mt-2 px-1 text-sm text-danger">
          {validationError}
        </p>
      )}
    </div>
  );
}
