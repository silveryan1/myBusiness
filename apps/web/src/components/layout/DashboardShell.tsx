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

  // Empêche le scroll du body quand sidebar est ouverte sur mobile
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

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar profile={profile} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
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
