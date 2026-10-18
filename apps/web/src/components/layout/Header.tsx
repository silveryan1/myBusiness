"use client";

import Link from "next/link";
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

      {/* Messagerie (l'ancien bouton « notifications » n'ouvrait rien et affichait un point permanent) */}
      <Link
        href="/messages"
        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        title="Messages"
        aria-label="Messages"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </Link>
    </header>
  );
}
