import Link from "next/link";
import type { Metadata } from "next";
import { getContexte, estAdmin } from "@/lib/contexte";
import { dateCourte } from "@/lib/format";
import { ROLES, libelle } from "@/lib/libelles";
import FormulaireOrganisation from "@/components/parametres/FormulaireOrganisation";

export const metadata: Metadata = { title: "Paramètres" };
export const dynamic = "force-dynamic";

export default async function ParametresPage() {
  const { supabase, profil, role, orgId } = await getContexte();
  const { data: org } = orgId
    ? await supabase.from("organisations").select("nom, slug, status, telephone, email_contact, adresse, ville, description, created_at").eq("id", orgId).single()
    : { data: null };
  const r = libelle(ROLES, role);

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Paramètres</h1>
        <p className="text-slate-400 mt-1">Votre profil{estAdmin(role) ? " et votre centre" : ""}</p>
      </div>

      <div className="glass-card p-6 space-y-4">
        <h2 className="font-semibold text-white text-lg border-b border-white/10 pb-3">👤 Mon profil</h2>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
            {profil.prenom?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-white text-lg truncate">{profil.prenom} {profil.nom}</div>
            <div className="text-slate-400 text-sm truncate">{profil.email}{profil.telephone ? ` · ${profil.telephone}` : ""}</div>
            <span className={`badge ${r.badge} mt-1`}>{r.label}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <Link href="/parametres/profil" className="btn btn-secondary btn-sm">✏️ Modifier mon profil</Link>
          <Link href="/parametres/mot-de-passe" className="btn btn-secondary btn-sm">🔒 Changer mon mot de passe</Link>
        </div>
      </div>

      {org && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="font-semibold text-white text-lg">🏢 Mon centre</h2>
            <span className={`badge ${org.status === "active" ? "badge-success" : org.status === "trial" ? "badge-warning" : "badge-error"}`}>
              {org.status === "trial" ? "Période d'essai" : org.status === "active" ? "Actif" : "Suspendu"}
            </span>
          </div>
          {estAdmin(role) ? (
            <FormulaireOrganisation initial={{
              nom: org.nom ?? "", telephone: org.telephone ?? "", email_contact: org.email_contact ?? "",
              adresse: org.adresse ?? "", ville: org.ville ?? "", description: org.description ?? "",
            }} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><div className="text-slate-500 mb-1">Nom</div><div className="text-white font-medium">{org.nom}</div></div>
              <div><div className="text-slate-500 mb-1">Ville</div><div className="text-white">{org.ville || "—"}</div></div>
              <div><div className="text-slate-500 mb-1">Téléphone</div><div className="text-white">{org.telephone || "—"}</div></div>
              <div><div className="text-slate-500 mb-1">E-mail</div><div className="text-white">{org.email_contact || "—"}</div></div>
            </div>
          )}
          <p className="text-xs text-slate-500">Créé le {dateCourte(org.created_at)}</p>
        </div>
      )}
    </div>
  );
}
