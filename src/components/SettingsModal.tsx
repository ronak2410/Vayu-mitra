'use client';

import React, { useState, useEffect } from 'react';
import { KeyRound, X, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSave: (key: string) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  apiKey,
  onSave,
}: SettingsModalProps) {
  const [draftKey, setDraftKey] = useState(apiKey);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            <h2 id="settings-modal-title" className="text-sm font-bold text-slate-900">
              Gemini API Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-xs text-slate-600 leading-relaxed">
            Enter your Google Gemini API key to power live{' '}
            <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-800">
              gemini-2.5-flash
            </code>{' '}
            recommendations and chat. Without a key, VayuMitra runs seamlessly in{' '}
            <strong>Smart Offline Mode</strong>.
          </p>
          <input
            type="password"
            value={draftKey}
            onChange={(e) => setDraftKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <p className="text-[11px] text-slate-400">
            Stored only in your browser session (or set <code>GEMINI_API_KEY</code> in{' '}
            <code>.env.local</code>).
          </p>
        </div>

        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-white rounded-lg border border-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(draftKey.trim());
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            Save Key
          </button>
        </div>
      </div>
    </div>
  );
}

