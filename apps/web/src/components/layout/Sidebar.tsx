"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Profile } from "@mybusiness/shared/types";

interface SidebarProps {
  profile: Profile | null;
  onClose?: () => void;
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

export default function Sidebar({ profile, onClose }: SidebarProps) {
  const pathname = usePathname();
  const role = profile?.role || "etudiant";
  const items = navItems[role as keyof typeof navItems] || navItems.etudiant;

  return (
    <aside className="sidebar" style={{ width: 260 }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
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

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`sidebar-item ${isActive ? "active" : ""}`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="px-3 py-4 border-t border-white/5">
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
    </aside>
  );
}
