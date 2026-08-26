"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Profile } from "@mybusiness/shared/types";

interface SidebarProps {
  profile: Profile | null;
}

const navItems = {
  super_admin: [
    { href: "/dashboard", icon: "🏠", label: "Tableau de bord" },
    { href: "/dashboard/organisations", icon: "🏢", label: "Organisations" },
    { href: "/dashboard/utilisateurs", icon: "👥", label: "Utilisateurs" },
    { href: "/dashboard/statistiques", icon: "📊", label: "Statistiques" },
    { href: "/dashboard/parametres", icon: "⚙️", label: "Paramètres" },
  ],
  admin: [
    { href: "/dashboard", icon: "🏠", label: "Tableau de bord" },
    { href: "/dashboard/formations", icon: "🎓", label: "Formations" },
    { href: "/dashboard/sessions", icon: "📅", label: "Sessions" },
    { href: "/dashboard/membres", icon: "👥", label: "Membres" },
    { href: "/dashboard/inscriptions", icon: "📋", label: "Inscriptions" },
    { href: "/dashboard/presences", icon: "✅", label: "Présences" },
    { href: "/dashboard/paiements", icon: "💳", label: "Paiements" },
    { href: "/dashboard/certificats", icon: "🏅", label: "Certificats" },
    { href: "/dashboard/messages", icon: "💬", label: "Messages" },
    { href: "/dashboard/rapports", icon: "📊", label: "Rapports" },
    { href: "/dashboard/parametres", icon: "⚙️", label: "Paramètres" },
  ],
  formateur: [
    { href: "/dashboard", icon: "🏠", label: "Tableau de bord" },
    { href: "/dashboard/mes-sessions", icon: "📅", label: "Mes sessions" },
    { href: "/dashboard/presences", icon: "✅", label: "Présences" },
    { href: "/dashboard/notes", icon: "📝", label: "Notes" },
    { href: "/dashboard/supports", icon: "📚", label: "Supports de cours" },
    { href: "/dashboard/messages", icon: "💬", label: "Messages" },
  ],
  etudiant: [
    { href: "/dashboard", icon: "🏠", label: "Tableau de bord" },
    { href: "/dashboard/formations", icon: "🎓", label: "Formations" },
    { href: "/dashboard/mon-planning", icon: "📅", label: "Mon planning" },
    { href: "/dashboard/mes-cours", icon: "📚", label: "Mes cours" },
    { href: "/dashboard/mes-notes", icon: "📝", label: "Mes notes" },
    { href: "/dashboard/certificats", icon: "🏅", label: "Mes certificats" },
    { href: "/dashboard/messages", icon: "💬", label: "Messages" },
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

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const role = profile?.role || "etudiant";
  const items = navItems[role as keyof typeof navItems] || navItems.etudiant;

  return (
    <aside className="sidebar">
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
