"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import type { Profile } from "@mybusiness/shared/types";

interface DashboardShellProps {
  profile: Profile | null;
  children: React.ReactNode;
}

export default function DashboardShell({ profile, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Ferme la sidebar à chaque changement de page
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Bloque le scroll du body quand sidebar est ouverte sur mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-app)" }}>
      <div className="mesh-bg" />

      {/* Overlay noir semi-transparent — mobile uniquement */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 lg:hidden"
          style={{ zIndex: 45 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — le CSS gère le slide in/out */}
      <Sidebar
        profile={profile}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen">
        <Header
          profile={profile}
          onMenuToggle={() => setSidebarOpen(prev => !prev)}
          sidebarOpen={sidebarOpen}
        />
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
