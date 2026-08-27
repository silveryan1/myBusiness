"use client";

import { useRouter } from "next/navigation";
import type { Profile } from "@mybusiness/shared/types";

interface HeaderProps {
  profile: Profile | null;
  onMenuToggle?: () => void;
  sidebarOpen?: boolean;
}

export default function Header({ profile, onMenuToggle, sidebarOpen }: HeaderProps) {
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bonjour";
    if (h < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8 py-4 border-b border-white/5"
      style={{ background: "rgba(15,15,26,0.8)", backdropFilter: "blur(16px)" }}
    >
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile uniquement */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Menu"
        >
          {sidebarOpen ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        <div>
          <h2 className="text-base font-semibold text-white">
            {greeting()}, <span className="gradient-text">{profile?.prenom}</span> 👋
          </h2>
          <p className="text-xs text-slate-500 hidden sm:block">
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Notifications */}
      <button
        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors relative"
        title="Notifications"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500" />
      </button>
    </header>
  );
}
