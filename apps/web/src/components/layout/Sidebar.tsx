"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@mybusiness/shared/types";

interface SidebarProps {
  profile: Profile | null;
  onClose?: () => void;
  isOpen?: boolean;
}

const navItems = {
  super_admin: [
    { href: "/dashboard", icon: "🏠", label: "Tableau de bord" },
    { href: "/organisations", icon: "🏢", label: "Organisations" },
    { href: "/utilisateurs", icon: "👥", label: "Utilisateurs" },
    { href: "/statistiques", icon: "📊", label: "Statistiques" },
    { href: "/parametres", icon: "⚙️", label: "Paramètres" },
  ],
  admin: [
    { href: "/dashboard", icon: "🏠", label: "Tableau de bord" },
    { href: "/formations", icon: "🎓", label: "Formations" },
    { href: "/sessions", icon: "📅", label: "Sessions" },
    { href: "/membres", icon: "👥", label: "Membres" },
    { href: "/inscriptions", icon: "📋", label: "Inscriptions" },
    { href: "/presences", icon: "✅", label: "Présences" },
    { href: "/paiements", icon: "💳", label: "Paiements" },
    { href: "/certificats", icon: "🏅", label: "Certificats" },
    { href: "/messages", icon: "💬", label: "Messages" },
    { href: "/rapports", icon: "📊", label: "Rapports" },
    { href: "/parametres", icon: "⚙️", label: "Paramètres" },
  ],
  formateur: [
    { href: "/dashboard", icon: "🏠", label: "Tableau de bord" },
    { href: "/presences", icon: "✅", label: "Présences" },
    { href: "/notes", icon: "📝", label: "Notes" },
    { href: "/messages", icon: "💬", label: "Messages" },
  ],
  etudiant: [
    { href: "/dashboard", icon: "🏠", label: "Tableau de bord" },
    { href: "/formations", icon: "🎓", label: "Formations" },
    { href: "/inscriptions", icon: "📋", label: "Mes inscriptions" },
    { href: "/certificats", icon: "🏅", label: "Mes certificats" },
    { href: "/messages", icon: "💬", label: "Messages" },
  ],
};

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Administrateur",
  formateur: "Formateur",
  etudiant: "Étudiant",
};

const roleBadgeColors: Record<string, string> = {
  super_admin: "badge-error",
  admin: "badge-primary",
  formateur: "badge-warning",
  etudiant: "badge-success",
};

export default function Sidebar({ profile, onClose, isOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const role = profile?.role || "etudiant";
  const items = navItems[role as keyof typeof navItems] || navItems.etudiant;

  // Détection scroll vs tap sur mobile
  const touchStartY = useRef(0);
  const isScrolling = useRef(false);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
    isScrolling.current = false;
  }

  function handleTouchMove(e: React.TouchEvent) {
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (deltaY > 8) {
      isScrolling.current = true;
    }
  }

  function handleLinkClick(e: React.MouseEvent | React.TouchEvent) {
    if (isScrolling.current) {
      e.preventDefault();
      return;
    }
    onClose?.();
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
          <span className="text-white font-bold text-sm">mB</span>
        </div>
        <div className="min-w-0">
          <div className="font-bold text-white text-sm truncate">myBusiness</div>
          {profile?.organisation && (
            <div className="text-xs text-slate-500 truncate">
              {(profile.organisation as { nom?: string })?.nom}
            </div>
          )}
        </div>
      </div>

      {/* Navigation scrollable — minHeight:0 + touch-action:pan-y */}
      <nav
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        style={{
          flex: 1,
          overflowY: "auto",
          minHeight: 0,
          padding: "0.75rem",
          touchAction: "pan-y",
          WebkitOverflowScrolling: "touch",
        } as React.CSSProperties}
      >
        {items.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              className={`sidebar-item ${isActive ? "active" : ""}`}
              style={{ marginBottom: "2px", display: "flex" }}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Pied fixe */}
      <div className="flex-shrink-0 border-t border-white/5">
        {/* Infos utilisateur */}
        <div className="px-3 pt-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03]">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
              {profile?.prenom?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-white truncate">
                {profile?.prenom} {profile?.nom}
              </div>
              <span className={`badge mt-0.5 ${roleBadgeColors[role] || "badge-primary"}`}>
                {roleLabels[role]}
              </span>
            </div>
          </div>
        </div>

        {/* Bouton déconnexion */}
        <div className="px-3 pb-4 pt-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Déconnexion
          </button>
        </div>
      </div>

    </aside>
  );
}
