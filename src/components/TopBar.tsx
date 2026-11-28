"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  MapPin,
  Navigation,
  Loader2,
  Wind,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { ResolvedLocation } from "@/types/air-quality";
import { EVALUATOR_PRESETS, EvaluatorPreset } from "@/lib/presets";

interface TopBarProps {
  currentLocation?: ResolvedLocation;
  onSelectLocation: (loc: ResolvedLocation) => void;
  activePresetId?: string | null;
  onSelectPreset?: (preset: EvaluatorPreset) => void;
  isLoading: boolean;
}

export function TopBar({
  onSelectLocation,
  activePresetId = null,
  onSelectPreset,
  isLoading,
}: TopBarProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ResolvedLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const presets = Object.values(EVALUATOR_PRESETS);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setHighlightedIndex(-1);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/locations?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.results || []);
          setIsOpen(true);
          setHighlightedIndex(-1);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.warn("Location search failed:", err);
        }
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `/api/locations?lat=${latitude.toFixed(4)}&lon=${longitude.toFixed(4)}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.location) {
              onSelectLocation(data.location);
              setQuery("");
              setIsOpen(false);
            }
          } else {
            const errJson = await res.json();
            setGeoError(errJson.error || "Coordinates outside India.");
          }
        } catch {
          setGeoError("Failed to resolve your GPS location.");
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          setGeoError("Location permission denied. Please search by city name.");
        } else {
          setGeoError("Unable to retrieve GPS coordinates.");
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      return;
    }
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev <= 0 ? suggestions.length - 1 : prev - 1
      );
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      const selected = suggestions[highlightedIndex];
      onSelectLocation(selected);
      setQuery("");
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const hasResults = suggestions.length > 0;
  const activeOptionId =
    isOpen && highlightedIndex >= 0 && suggestions[highlightedIndex]
      ? `location-option-${highlightedIndex}`
      : undefined;

  return (
    <header className="sm:sticky sm:top-0 z-40 border-b border-subtle bg-surface">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 min-h-16 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Brand Link Back to Overview / */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/"
            aria-label="Back to VayuPlan overview"
            className="inline-flex items-center gap-2.5 group rounded-lg pr-2 min-h-[44px]"
          >
            <span className="w-9 h-9 rounded-lg bg-obsidian group-hover:bg-accent text-ink-on-dark flex items-center justify-center transition-colors">
              <Wind className="w-4 h-4 text-accent-on-dark" aria-hidden="true" />
            </span>
            <span className="flex flex-col">
              <span className="font-display font-bold text-lg leading-tight tracking-tight text-ink">
                VayuPlan
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-ink-muted group-hover:text-accent transition-colors">
                <ArrowLeft className="w-3 h-3" aria-hidden="true" />
                <span>Overview</span>
              </span>
            </span>
          </Link>
        </div>

        {/* Center: Pan-India Search Combobox & GPS Button */}
        <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-md">
          <div ref={searchContainerRef} className="relative flex-1 min-w-0">
            <div className="relative flex items-center">
              <Search
                className="w-4 h-4 text-ink-muted absolute left-3 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                role="combobox"
                aria-expanded={isOpen && hasResults}
                aria-autocomplete="list"
                aria-controls="location-results"
                aria-activedescendant={activeOptionId}
                aria-label="Search Indian city or district"
                placeholder="Search Indian city (Delhi, Pune, Patna)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
                className="w-full text-base sm:text-sm pl-9 pr-9 py-2 min-h-[44px] bg-subtle border border-control rounded-lg text-ink placeholder:text-ink-muted focus:bg-surface focus:border-accent transition-colors"
              />
              {isSearching && (
                <Loader2
                  className="w-4 h-4 text-accent motion-safe:animate-spin absolute right-3 pointer-events-none"
                  aria-hidden="true"
                />
              )}
            </div>

            {isOpen && hasResults && (
              <ul
                id="location-results"
                role="listbox"
                aria-label="Indian city search results"
                className="absolute left-0 right-0 top-full mt-1.5 bg-surface border border-control rounded-lg elevation-3 overflow-hidden z-50 max-h-64 overflow-y-auto"
              >
                {suggestions.map((loc, idx) => (
                  <li
                    key={`${loc.lat}-${loc.lon}-${idx}`}
                    id={`location-option-${idx}`}
                    role="option"
                    aria-selected={idx === highlightedIndex}
                    onClick={() => {
                      onSelectLocation(loc);
                      setQuery("");
                      setIsOpen(false);
                      setHighlightedIndex(-1);
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-3.5 py-2.5 min-h-[44px] cursor-pointer text-sm flex items-center justify-between transition-colors ${
                      idx === highlightedIndex
                        ? "bg-accent-wash text-ink"
                        : "text-ink-secondary hover:bg-canvas"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin
                        className="w-4 h-4 text-accent shrink-0"
                        aria-hidden="true"
                      />
                      <span className="font-medium text-ink truncate">
                        {loc.name}
                      </span>
                      <span className="text-xs text-ink-muted truncate">
                        ({loc.state})
                      </span>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-ink-muted ml-2 shrink-0">
                      {loc.lat.toFixed(2)}°, {loc.lon.toFixed(2)}°
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {isOpen && !hasResults && !isSearching && (
              <div
                role="status"
                aria-live="polite"
                className="absolute left-0 right-0 top-full mt-1.5 bg-surface border border-control rounded-lg elevation-3 px-3.5 py-3 text-xs text-ink-muted z-50"
              >
                No Indian cities matched &ldquo;{query.trim()}&rdquo;. Try another city or district name.
              </div>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleUseMyLocation}
            disabled={isLocating || isLoading}
            aria-label="Use my current GPS location"
            title="Locate via GPS"
            className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3.5 min-h-[44px] min-w-[44px] border border-control bg-surface text-ink hover:border-accent hover:text-accent rounded-lg transition-colors disabled:opacity-55 shrink-0"
          >
            {isLocating ? (
              <Loader2
                className="w-4 h-4 motion-safe:animate-spin text-accent"
                aria-hidden="true"
              />
            ) : (
              <Navigation className="w-4 h-4 text-accent" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">GPS</span>
          </motion.button>
        </div>

        {/* Right: Compact 4-Preset Quick-Switcher Pills */}
        {onSelectPreset && (
          <nav
            aria-label="Quick city and persona presets"
            className="w-full xl:w-auto flex flex-wrap sm:flex-nowrap items-center gap-1.5 overflow-x-auto pb-0.5 xl:pb-0 scrollbar-none"
          >
            {presets.map((preset) => {
              const isActive = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectPreset(preset)}
                  title={preset.description}
                  aria-label={`${preset.title}: ${preset.description}`}
                  aria-pressed={isActive}
                  className={`relative px-3.5 min-h-[44px] rounded-lg border text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    isActive
                      ? "bg-obsidian text-ink-on-dark border-obsidian"
                      : "bg-subtle text-ink-secondary border-control hover:border-accent hover:text-ink"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="topbar-preset-pill"
                      transition={{ type: "spring", stiffness: 440, damping: 34 }}
                      className="absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-accent-on-dark"
                      aria-hidden="true"
                    />
                  )}
                  <span className="relative z-10">{preset.location.name}</span>
                </button>
              );
            })}
          </nav>
        )}
      </div>

      {geoError && (
        <div
          role="alert"
          className="bg-danger-surface border-t border-danger px-4 sm:px-6 lg:px-8 py-2 text-xs text-danger"
        >
          <div className="max-w-[1440px] mx-auto flex items-center gap-2">
            <AlertCircle
              className="w-4 h-4 text-danger-icon shrink-0"
              aria-hidden="true"
            />
            <span>{geoError}</span>
            <button
              type="button"
              onClick={() => setGeoError(null)}
              className="ml-auto px-3.5 min-h-[44px] rounded-lg border border-danger bg-surface font-semibold text-danger hover:border-obsidian transition-colors shrink-0"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
