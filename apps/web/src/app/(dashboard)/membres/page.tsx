import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getContexte, estAdmin } from "@/lib/contexte";
import { dateCourte, nomComplet } from "@/lib/format";
import { ROLES, libelle } from "@/lib/libelles";
import { activerMembre } from "@/app/actions/membre";
import EnTete from "@/components/ui/EnTete";
import Vide from "@/components/ui/Vide";
import Stat from "@/components/ui/Stat";
import BoutonAction from "@/components/ui/BoutonAction";
import RoleMembre from "@/components/membres/RoleMembre";

export const metadata: Metadata = { title: "Membres" };
export const dynamic = "force-dynamic";

const FILTRES = [
  { cle: "", label: "Tous" },
  { cle: "etudiant", label: "Étudiants" },
  { cle: "formateur", label: "Formateurs" },
  { cle: "admin", label: "Administration" },
];

export default async function MembresPage({ searchParams }: { searchParams: Promise<{ role?: string; q?: string }> }) {
  const { role: filtreRole = "", q = "" } = await searchParams;
  const { supabase, user, role, orgId } = await getContexte();
  if (!estAdmin(role)) redirect("/dashboard");

  const { data } = await supabase.from("profiles")
    .select("id, prenom, nom, email, telephone, role, is_active, created_at")
    .eq("organisation_id", orgId ?? "")
    .order("nom");
  const tous = data ?? [];
  const recherche = q.trim().toLowerCase();
  const membres = tous
    .filter((m) => !filtreRole || m.role === filtreRole)
    .filter((m) => !recherche || `${m.prenom} ${m.nom} ${m.email} ${m.telephone ?? ""}`.toLowerCase().includes(recherche));
  const compte = (r: string) => tous.filter((m) => m.role === r).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <EnTete titre="Membres" sousTitre="Étudiants, formateurs et administration de votre centre">
        <Link href="/membres/inviter" className="btn btn-primary">+ Ajouter un membre</Link>
      </EnTete>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Total" valeur={tous.length} icone="👥" />
        <Stat label="Étudiants" valeur={compte("etudiant")} icone="🎓" couleur="from-emerald-500 to-teal-600" />
        <Stat label="Formateurs" valeur={compte("formateur")} icone="🧑‍🏫" couleur="from-amber-500 to-orange-600" />
        <Stat label="Administration" valeur={compte("admin") + compte("super_admin")} icone="🛡️" couleur="from-red-500 to-pink-600" />
      </div>

      <form className="flex flex-col sm:flex-row gap-2">
        <input name="q" defaultValue={q} className="form-input sm:flex-1" placeholder="Rechercher un nom, un e-mail, un téléphone…" />
        {filtreRole && <input type="hidden" name="role" value={filtreRole} />}
        <button className="btn btn-secondary">Rechercher</button>
      </form>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTRES.map((f) => (
          <Link key={f.cle} href={f.cle ? `/membres?role=${f.cle}` : "/membres"}
            className={`btn btn-sm flex-shrink-0 ${filtreRole === f.cle ? "btn-primary" : "btn-secondary"}`}>{f.label}</Link>
        ))}
      </div>

      {membres.length === 0 ? (
        <Vide icone="👥" titre={tous.length ? "Aucun résultat" : "Aucun membre"} texte={tous.length ? "Essayez une autre recherche." : "Ajoutez vos formateurs et vos étudiants."}>
          {!tous.length && <Link href="/membres/inviter" className="btn btn-primary">Ajouter un membre</Link>}
        </Vide>
      ) : (
        <div className="glass-card overflow-hidden divide-y divide-white/5">
          {membres.map((m) => {
            const moi = m.id === user.id;
            const r = libelle(ROLES, m.role);
            return (
              <div key={m.id} className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                    {m.prenom?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0">
                    <div className="text-white font-medium truncate">
                      {nomComplet(m)} {moi && <span className="text-xs text-slate-500">(vous)</span>}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {[m.email, m.telephone].filter(Boolean).join(" · ")} · depuis le {dateCourte(m.created_at)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {moi || m.role === "super_admin" ? (
                    <span className={`badge ${r.badge}`}>{r.label}</span>
                  ) : (
                    <RoleMembre id={m.id} role={m.role} />
                  )}
                  <span className={`badge ${m.is_active ? "badge-success" : "badge-error"}`}>{m.is_active ? "Actif" : "Désactivé"}</span>
                  {!moi && m.role !== "super_admin" && (
                    m.is_active ? (
                      <BoutonAction action={activerMembre.bind(null, m.id, false)} libelle="Désactiver" confirmer="Confirmer" className="btn btn-ghost btn-sm" />
                    ) : (
                      <BoutonAction action={activerMembre.bind(null, m.id, true)} libelle="Réactiver" className="btn btn-secondary btn-sm" />
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
