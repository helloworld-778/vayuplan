"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, Navigation, Loader2, Wind, AlertCircle } from "lucide-react";
import { ResolvedLocation } from "@/types/air-quality";

interface TopBarProps {
  currentLocation?: ResolvedLocation;
  onSelectLocation: (loc: ResolvedLocation) => void;
  isLoading: boolean;
}

export function TopBar({
  onSelectLocation,
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

  // Close dropdown on outside click
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

  // Debounced search with AbortController for race condition protection
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/locations?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
        });
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

  // GPS geolocation handler
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
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      const selected = suggestions[highlightedIndex];
      onSelectLocation(selected);
      setQuery("");
      setIsOpen(false);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <header className="border-b border-[#E2DFD6] bg-[#FFFFFF]/90 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#14181F] text-[#FFFFFF] flex items-center justify-center shadow-xs">
            <Wind className="w-5 h-5 text-emerald-400 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-[#14181F]">
                VayuPlan
              </span>
              <span className="text-xs font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-[#EFECE6] text-[#474D58] border border-[#DDD9CE]">
                v1.0 • CPCB CAMS
              </span>
            </div>
            <p className="text-xs text-[#5E6470] hidden sm:block">
              Pan-India Urban Air Quality & Low-Emission Assistant
            </p>
          </div>
        </div>

        {/* Location Search & GPS Controls */}
        <div className="flex items-center gap-2.5 flex-1 max-w-lg md:ml-auto">
          <div ref={searchContainerRef} className="relative flex-1">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-[#7A8290] absolute left-3 pointer-events-none" />
              <input
                type="text"
                role="combobox"
                aria-expanded={isOpen}
                aria-autocomplete="list"
                aria-controls="location-results"
                aria-label="Search Indian city or district"
                placeholder="Search Indian city (e.g., Delhi, Pune, Patna)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => suggestions.length > 0 && setIsOpen(true)}
                className="w-full text-sm pl-9 pr-9 py-2 bg-[#F7F6F2] border border-[#DDD9CE] rounded-md text-[#14181F] placeholder:text-[#8C93A0] focus:bg-[#FFFFFF] focus:border-[#14181F] focus:outline-none transition-colors"
              />
              {isSearching && (
                <Loader2 className="w-4 h-4 text-[#7A8290] animate-spin absolute right-3 pointer-events-none" />
              )}
            </div>

            {/* Suggestions Dropdown */}
            {isOpen && suggestions.length > 0 && (
              <ul
                id="location-results"
                role="listbox"
                className="absolute left-0 right-0 top-full mt-1.5 bg-[#FFFFFF] border border-[#DDD9CE] rounded-md shadow-lg overflow-hidden z-50 max-h-64 overflow-y-auto"
              >
                {suggestions.map((loc, idx) => (
                  <li
                    key={`${loc.lat}-${loc.lon}-${idx}`}
                    role="option"
                    aria-selected={idx === highlightedIndex}
                    onClick={() => {
                      onSelectLocation(loc);
                      setQuery("");
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-3.5 py-2.5 cursor-pointer text-sm flex items-center justify-between transition-colors ${
                      idx === highlightedIndex
                        ? "bg-[#EFECE6] text-[#14181F]"
                        : "text-[#2B303B] hover:bg-[#F7F6F2]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#6E7582] shrink-0" />
                      <span className="font-medium text-[#14181F]">{loc.name}</span>
                      <span className="text-xs text-[#7A8290]">({loc.state})</span>
                    </div>
                    <span className="text-xs font-mono text-[#8C93A0]">
                      {loc.lat.toFixed(2)}°, {loc.lon.toFixed(2)}°
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* GPS Location Button */}
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={isLocating || isLoading}
            aria-label="Use my current GPS location"
            title="Locate via GPS"
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 border border-[#DDD9CE] bg-[#FFFFFF] text-[#2B303B] hover:bg-[#F7F6F2] hover:border-[#14181F] active:bg-[#EFECE6] rounded-md transition-colors disabled:opacity-60 shrink-0"
          >
            {isLocating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Navigation className="w-3.5 h-3.5 text-[#059669]" />
            )}
            <span className="hidden sm:inline">GPS</span>
          </button>
        </div>
      </div>

      {/* Geolocation error notification banner */}
      {geoError && (
        <div className="bg-rose-50 border-t border-rose-200 px-4 py-1.5 text-xs text-rose-900 flex items-center justify-between">
          <div className="flex items-center gap-1.5 max-w-7xl mx-auto w-full">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>{geoError}</span>
            <button
              onClick={() => setGeoError(null)}
              className="ml-auto underline hover:text-rose-950 font-medium text-xs"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
