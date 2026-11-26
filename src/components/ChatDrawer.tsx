'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquareHeart, Send, X, Sparkles, Mic, MicOff } from 'lucide-react';
import { AQIData, ChatMessage, HouseholdProfile } from '@/types/vayumitra';

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  onresult: (e: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => void;
  onerror: () => void;
  onend: () => void;
  start: () => void;
}

interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: new () => SpeechRecognitionInstance;
  webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
}

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: HouseholdProfile;
  aqiData: AQIData;
  apiKey: string;
}

const SUGGESTED_PROMPTS = [
  'Is it safe to take my 3-year-old to the park at 5 PM?',
  'How do I keep indoor air clean without an expensive purifier?',
  'Should I open windows for ventilation right now?',
];

export default function ChatDrawer({
  isOpen,
  onClose,
  profile,
  aqiData,
  apiKey,
}: ChatDrawerProps) {
  const idCounter = useRef(1);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hi! I'm **VayuMitra**, your family's AI Smog Advisor. Currently tracking **${profile.city}** (AQI **${aqiData.aqi} — ${aqiData.status}**). Ask me anything about outdoor safety, indoor air hacks, or commute choices!`,
      timestamp: 'Now',
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);

  const handleVoiceInput = () => {
    const win = window as SpeechRecognitionWindow;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRec || listening) return;

    const rec = new SpeechRec();
    rec.lang = 'en-IN';
    rec.interimResults = false;
    setListening(true);
    rec.onresult = (e) => {
      const transcript = e.results?.[0]?.[0]?.transcript || '';
      if (transcript) setInput(transcript);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sendMessage = async (text: string) => {
    const q = text.trim();
    if (!q || sending) return;

    const userId = `u-${idCounter.current++}`;
    const userMsg: ChatMessage = {
      id: userId,
      role: 'user',
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, profile, aqiData, apiKey }),
      });
      const data = await res.json();
      const botId = `a-${idCounter.current++}`;
      const botMsg: ChatMessage = {
        id: botId,
        role: 'assistant',
        content: data.reply || 'Sorry, I could not generate a response.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errId = `err-${idCounter.current++}`;
      setMessages((prev) => [
        ...prev,
        {
          id: errId,
          role: 'assistant',
          content: 'Network error. Please try again.',
          timestamp: 'Now',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="AI Smog Advisor Chat"
    >
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquareHeart className="w-5 h-5" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-bold">AI Smog Advisor</h2>
              <p className="text-[11px] text-emerald-100">
                Context-aware • {profile.city} (AQI {aqiData.aqi})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white transition"
            aria-label="Close AI Smog Advisor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50"
          aria-live="polite"
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-xs'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl px-3.5 py-2 text-xs text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                Analyzing local smog &amp; household risk...
              </div>
            </div>
          )}
        </div>

        {/* Suggested Prompts */}
        <div className="px-4 py-2 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto">
          {SUGGESTED_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => sendMessage(p)}
              className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="p-3 bg-white border-t border-slate-200 flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={500}
            aria-label="Ask a question to the AI Smog Advisor"
            placeholder="Ask about outdoor play, masks, IAQ..."
            className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="button"
            onClick={handleVoiceInput}
            aria-label={listening ? 'Listening for voice question' : 'Ask using voice'}
            title="Voice input"
            className={`p-2.5 rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              listening
                ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button
            type="submit"
            disabled={sending || !input.trim()}
            aria-label="Send message"
            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
