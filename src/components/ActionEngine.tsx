'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  CalendarClock,
  Home,
  Leaf,
  ChevronDown,
  ChevronUp,
  HeartPulse,
  Globe2,
  RefreshCw,
} from 'lucide-react';
import { ActionCategory, ActionEngineResponse, RecommendationCard } from '@/types/vayumitra';
import TiltCard from '@/components/TiltCard';

interface ActionEngineProps {
  data: ActionEngineResponse;
  loading: boolean;
  onRefresh: () => void;
}

const TABS: { id: ActionCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'routines', label: 'Low-Emission Daily Routines', icon: <CalendarClock className="w-4 h-4" /> },
  { id: 'iaq', label: 'Indoor Air Quality (IAQ) Hacks', icon: <Home className="w-4 h-4" /> },
  { id: 'alternatives', label: 'Sustainable Alternatives', icon: <Leaf className="w-4 h-4" /> },
];

export default function ActionEngine({ data, loading, onRefresh }: ActionEngineProps) {
  const [activeTab, setActiveTab] = useState<ActionCategory>('routines');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const cards: RecommendationCard[] = data[activeTab] || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1 }}
      className="bg-white/85 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-md overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/40">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">GenAI Action Engine</h2>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                data.isFallback
                  ? 'bg-slate-100 text-slate-600 border border-slate-200'
                  : 'bg-emerald-600 text-white shadow-xs'
              }`}
            >
              {data.isFallback ? 'Smart Offline Mode' : 'Gemini 2.5 Flash'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Interactive 3D recommendation cards with quantified Personal & Community Direct Impact
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onRefresh}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 shadow-xs transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Generating...' : 'Regenerate Plan'}
        </motion.button>
      </div>

      {/* Animated Tabs */}
      <div
        role="tablist"
        aria-label="Action categories"
        className="flex border-b border-slate-100 overflow-x-auto bg-slate-50/60 px-2 pt-1"
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition ${
                active ? 'text-emerald-800' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.icon}
              {tab.label}
              {active && (
                <motion.div
                  layoutId="activeActionTab"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-emerald-600 rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 3D Tilt Cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {cards.map((card, index) => {
            const isExpanded = expandedIds[card.id] ?? true;
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.06 }}
              >
                <TiltCard className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/70 p-4 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {card.effort}
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/70">
                        {card.cost}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1.5 leading-snug">
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed mb-3">
                      {card.description}
                    </p>
                  </div>

                  {/* Direct Impact Explainer */}
                  <div className="border-t border-slate-200/80 pt-2.5 mt-1">
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() => toggleExpand(card.id)}
                      className="w-full flex items-center justify-between text-xs font-bold text-emerald-800 hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-md"
                    >
                      <span>Why This Matters (Direct Impact)</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden mt-2 space-y-2 text-[11px] leading-snug"
                        >
                          <div className="bg-rose-50/90 border border-rose-100 rounded-xl p-2.5 flex items-start gap-2">
                            <HeartPulse className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-rose-900 block">
                                Personal Health Impact
                              </span>
                              <span className="text-rose-800">
                                {card.directImpact.personalHealth}
                              </span>
                            </div>
                          </div>

                          <div className="bg-emerald-50/90 border border-emerald-100 rounded-xl p-2.5 flex items-start gap-2">
                            <Globe2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-emerald-900 block">
                                Community & Environmental
                              </span>
                              <span className="text-emerald-800">
                                {card.directImpact.communityEnvironmental}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </TiltCard>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
