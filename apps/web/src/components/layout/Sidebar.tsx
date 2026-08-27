"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@mybusiness/shared/types";
import {
  LayoutDashboard,
  GraduationCap,
  CalendarDays,
  Users,
  ClipboardList,
  CheckSquare,
  CreditCard,
  Award,
  MessageSquare,
  BarChart2,
  Settings,
  Building2,
  UserCog,
  TrendingUp,
  PenLine,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  profile: Profile | null;
  onClose?: () => void;
  isOpen?: boolean;
}

const navItems = {
  super_admin: [
    { href: "/dashboard",      icon: LayoutDashboard, label: "Tableau de bord" },
    { href: "/organisations",  icon: Building2,        label: "Organisations" },
    { href: "/utilisateurs",   icon: UserCog,          label: "Utilisateurs" },
    { href: "/statistiques",   icon: TrendingUp,       label: "Statistiques" },
    { href: "/parametres",     icon: Settings,         label: "Paramètres" },
  ],
  admin: [
    { href: "/dashboard",     icon: LayoutDashboard, label: "Tableau de bord" },
    { href: "/formations",    icon: GraduationCap,   label: "Formations" },
    { href: "/sessions",      icon: CalendarDays,    label: "Sessions" },
    { href: "/membres",       icon: Users,           label: "Membres" },
    { href: "/inscriptions",  icon: ClipboardList,   label: "Inscriptions" },
    { href: "/presences",     icon: CheckSquare,     label: "Présences" },
    { href: "/paiements",     icon: CreditCard,      label: "Paiements" },
    { href: "/certificats",   icon: Award,           label: "Certificats" },
    { href: "/messages",      icon: MessageSquare,   label: "Messages" },
    { href: "/rapports",      icon: BarChart2,       label: "Rapports" },
    { href: "/parametres",    icon: Settings,        label: "Paramètres" },
  ],
  formateur: [
    { href: "/dashboard",  icon: LayoutDashboard, label: "Tableau de bord" },
    { href: "/presences",  icon: CheckSquare,     label: "Présences" },
    { href: "/notes",      icon: PenLine,         label: "Notes" },
    { href: "/messages",   icon: MessageSquare,   label: "Messages" },
  ],
  etudiant: [
    { href: "/dashboard",    icon: LayoutDashboard, label: "Tableau de bord" },
    { href: "/formations",   icon: GraduationCap,   label: "Formations" },
    { href: "/inscriptions", icon: ClipboardList,   label: "Mes inscriptions" },
    { href: "/certificats",  icon: Award,           label: "Mes certificats" },
    { href: "/messages",     icon: MessageSquare,   label: "Messages" },
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

  // Détection scroll vs tap — empêche navigation accidentelle au scroll
  const touchStartY = useRef(0);
  const isScrolling = useRef(false);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
    isScrolling.current = false;
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (Math.abs(e.touches[0].clientY - touchStartY.current) > 8) {
      isScrolling.current = true;
    }
  }

  function handleLinkClick(e: React.MouseEvent) {
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
      <div style={{ flexShrink: 0, padding: "1.25rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #9333ea)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>mB</span>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: "white", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>myBusiness</div>
          {profile?.organisation && (
            <div style={{ fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {(profile.organisation as { nom?: string })?.nom}
            </div>
          )}
        </div>
      </div>

      {/* Navigation — flex:1 + minHeight:0 = scrollable */}
      <nav
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: "0.75rem",
          touchAction: "pan-y",
          WebkitOverflowScrolling: "touch",
        } as React.CSSProperties}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              className={`sidebar-item ${isActive ? "active" : ""}`}
              style={{ marginBottom: 2 }}
            >
              <Icon size={18} strokeWidth={1.8} style={{ flexShrink: 0 }} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Pied de sidebar — toujours visible */}
      <div style={{ flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        {/* Infos utilisateur */}
        <div style={{ padding: "0.75rem 0.75rem 0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", borderRadius: 12, background: "rgba(255,255,255,0.03)" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #9333ea)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", fontSize: 14, flexShrink: 0 }}>
              {profile?.prenom?.[0]?.toUpperCase() || "U"}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {profile?.prenom} {profile?.nom}
              </div>
              <span className={`badge mt-0.5 ${roleBadgeColors[role] || "badge-primary"}`}>
                {roleLabels[role]}
              </span>
            </div>
          </div>
        </div>

        {/* Bouton déconnexion */}
        <div style={{ padding: "0 0.75rem 1rem" }}>
          <button
            onClick={handleLogout}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.625rem 1rem", borderRadius: 12, fontSize: 14, fontWeight: 500, color: "#f87171", background: "transparent", border: "none", cursor: "pointer", transition: "background 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.1)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <LogOut size={16} strokeWidth={1.8} style={{ flexShrink: 0 }} />
            Déconnexion
          </button>
        </div>
      </div>

    </aside>
  );
}
