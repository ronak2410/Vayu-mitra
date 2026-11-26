'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Navigation, Loader2 } from 'lucide-react';
import { GeocodedLocation, reverseGeocode, searchLocations } from '@/lib/aqiService';

interface LocationSearchBarProps {
  currentLabel: string;
  onSelectLocation: (loc: {
    city: string;
    neighborhood: string;
    lat: number;
    lon: number;
  }) => void;
}

export default function LocationSearchBar({
  currentLabel,
  onSelectLocation,
}: LocationSearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodedLocation[]>([]);
  const [searching, setSearching] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      setSearching(true);
      const found = await searchLocations(query);
      setResults(found);
      setSearching(false);
      setOpen(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleDetectGPS = () => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const { city, neighborhood } = await reverseGeocode(latitude, longitude);
        onSelectLocation({ city, neighborhood, lat: latitude, lon: longitude });
        setQuery('');
        setOpen(false);
        setDetecting(false);
      },
      () => {
        setDetecting(false);
      },
      { timeout: 7000 }
    );
  };

  return (
    <div ref={containerRef} className="relative flex items-center gap-2 w-full max-w-xl">
      <div className="relative flex-1">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open && results.length > 0}
          aria-controls="location-search-listbox"
          aria-label="Search any city or area"
          value={query}
          onFocus={() => results.length > 0 && setOpen(true)}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search any city or area (currently: ${currentLabel})...`}
          className="w-full pl-9 pr-9 py-2.5 text-xs sm:text-sm bg-white/85 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 placeholder:text-slate-400"
        />
        {searching && (
          <Loader2 className="w-4 h-4 text-emerald-600 animate-spin absolute right-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
        )}

        <AnimatePresence>
          {open && results.length > 0 && (
            <motion.div
              id="location-search-listbox"
              role="listbox"
              aria-label="City search results"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="absolute left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-40"
            >
              {results.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => {
                    onSelectLocation({
                      city: item.name,
                      neighborhood: [item.admin1, item.country].filter(Boolean).join(', '),
                      lat: item.lat,
                      lon: item.lon,
                    });
                    setQuery('');
                    setOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-emerald-50 flex items-center justify-between gap-2 border-b border-slate-100 last:border-b-0 transition"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {item.name}
                    </span>
                    <span className="text-[11px] text-slate-500 truncate">
                      {[item.admin1, item.country].filter(Boolean).join(', ')}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-emerald-700 shrink-0">
                    Load Live AQI
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        type="button"
        onClick={handleDetectGPS}
        disabled={detecting}
        className="shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-60"
        title="Detect my exact GPS location and load live AQI"
      >
        {detecting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Navigation className="w-3.5 h-3.5" />
        )}
        <span className="hidden sm:inline">{detecting ? 'Locating...' : 'Detect My Area'}</span>
      </motion.button>
    </div>
  );
}

