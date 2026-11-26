'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Flame,
  HardHat,
  Car,
  Factory,
  Sparkles,
  ThumbsUp,
  PlusCircle,
  CheckCircle2,
} from 'lucide-react';
import { CommunityReport } from '@/types/vayumitra';

const INITIAL_REPORTS: CommunityReport[] = [
  {
    id: 'c-1',
    author: 'Rohan M.',
    ward: 'Ward 14 • East Block',
    type: 'Garbage Burning',
    description:
      'Dry leaves & plastic burning near the park boundary wall. Reported to municipal helpline.',
    timestamp: '18 mins ago',
    upvotes: 14,
    verified: true,
  },
  {
    id: 'c-2',
    author: 'Ananya S.',
    ward: 'Ward 14 • Main Market',
    type: 'Positive Action',
    description:
      '42 families in our ward switched to school carpooling this week, preventing ~310 kg of CO2 emissions!',
    timestamp: '2 hours ago',
    upvotes: 38,
    verified: true,
  },
  {
    id: 'c-3',
    author: 'Vikram K.',
    ward: 'Sector 62 Link Rd',
    type: 'Construction Dust',
    description:
      'Uncovered sand & cement unloading without water sprinkling. Avoid walking/cycling on this stretch.',
    timestamp: '4 hours ago',
    upvotes: 9,
    verified: false,
  },
];

function getTypeIcon(type: CommunityReport['type']) {
  switch (type) {
    case 'Garbage Burning':
      return <Flame className="w-3.5 h-3.5 text-rose-600" />;
    case 'Construction Dust':
      return <HardHat className="w-3.5 h-3.5 text-amber-600" />;
    case 'Traffic Bottleneck':
      return <Car className="w-3.5 h-3.5 text-orange-600" />;
    case 'Industrial Smoke':
      return <Factory className="w-3.5 h-3.5 text-purple-600" />;
    case 'Positive Action':
      return <Sparkles className="w-3.5 h-3.5 text-emerald-600" />;
  }
}

export default function CommunityHub({ neighborhood }: { neighborhood: string }) {
  const [reports, setReports] = useState<CommunityReport[]>(INITIAL_REPORTS);
  const [showForm, setShowForm] = useState(false);
  const [newType, setNewType] = useState<CommunityReport['type']>('Garbage Burning');
  const [newDesc, setNewDesc] = useState('');

  const handleUpvote = (id: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, upvotes: r.upvotes + 1 } : r))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim()) return;
    const item: CommunityReport = {
      id: `c-${Date.now()}`,
      author: 'You (Neighbor)',
      ward: neighborhood || 'Your Ward',
      type: newType,
      description: newDesc.trim(),
      timestamp: 'Just now',
      upvotes: 1,
      verified: false,
    };
    setReports([item, ...reports]);
    setNewDesc('');
    setShowForm(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15 }}
      className="bg-white/85 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-md overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            Community Smog Watch & Collective Impact
          </h2>
          <p className="text-xs text-slate-500">
            Hyperlocal pollution alerts & neighborhood clean-air wins
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowForm(!showForm)}
          className="self-start sm:self-auto flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Log Local Spike / Win
        </motion.button>
      </div>

      {/* Collective Impact Banner */}
      <div className="bg-gradient-to-r from-emerald-50/90 to-teal-50/70 border-b border-emerald-100 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-medium text-emerald-950">
          🌱 <strong>Ward Collective Impact:</strong> 42 families carpooling • 18 DIY HEPA
          filters built •{' '}
          <strong className="text-emerald-700">310 kg CO₂ prevented this week</strong>
        </span>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 overflow-hidden"
          >
            <div className="flex flex-wrap gap-2">
              {(
                [
                  'Garbage Burning',
                  'Construction Dust',
                  'Traffic Bottleneck',
                  'Industrial Smoke',
                  'Positive Action',
                ] as CommunityReport['type'][]
              ).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setNewType(t)}
                  className={`text-xs px-2.5 py-1 rounded-full border font-medium transition ${
                    newType === t
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Describe the local pollution spike or clean-air action..."
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition"
              >
                Post
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="divide-y divide-slate-100">
        {reports.map((report) => (
          <motion.div
            key={report.id}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 px-6 flex items-start justify-between gap-4 hover:bg-slate-50/70 transition"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800">
                  {getTypeIcon(report.type)}
                  {report.type}
                </span>
                <span className="text-xs font-bold text-slate-800">{report.author}</span>
                <span className="text-[11px] text-slate-400">
                  • {report.ward} • {report.timestamp}
                </span>
                {report.verified && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{report.description}</p>
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleUpvote(report.id)}
              className="shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700 shadow-2xs transition"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              {report.upvotes}
            </motion.button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
