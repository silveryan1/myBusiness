import Link from "next/link";
import type { Metadata } from "next";
import { getContexte, estAdmin } from "@/lib/contexte";
import { fcfa } from "@/lib/format";
import { NIVEAUX, STATUTS_FORMATION, libelle } from "@/lib/libelles";
import EnTete from "@/components/ui/EnTete";
import Vide from "@/components/ui/Vide";

export const metadata: Metadata = { title: "Formations" };
export const dynamic = "force-dynamic";

export default async function FormationsPage() {
  const { supabase, role, orgId } = await getContexte();
  const admin = estAdmin(role);

  // La base ne montre aux étudiants que les formations publiées.
  const { data } = await supabase.from("formations")
    .select("id, titre, description, categorie, niveau, duree_heures, is_payante, prix, status, sessions(id, status, date_debut, places_restantes)")
    .eq("organisation_id", orgId ?? "")
    .order("created_at", { ascending: false });
  const formations = (data ?? []).filter((f) => admin || f.status === "published");
  const maintenant = new Date().toISOString();

  return (
    <div className="space-y-6 animate-fade-in">
      <EnTete titre={admin ? "Formations" : "Catalogue des formations"}
        sousTitre={admin ? "Votre catalogue : brouillons, formations publiées et archivées" : "Choisissez une formation puis une session pour demander votre place"}>
        {admin && <Link href="/formations/nouveau" className="btn btn-primary">+ Nouvelle formation</Link>}
      </EnTete>

      {formations.length === 0 ? (
        <Vide icone="🎓" titre={admin ? "Aucune formation" : "Aucune formation publiée"}
          texte={admin ? "Créez votre première formation, puis publiez-la pour qu'elle apparaisse dans le catalogue des étudiants." : "Le centre n'a pas encore publié de formation. Revenez bientôt."}>
          {admin && <Link href="/formations/nouveau" className="btn btn-primary">Créer une formation</Link>}
        </Vide>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {formations.map((f) => {
            const ouvertes = (f.sessions ?? []).filter((s) => ["scheduled", "ongoing"].includes(s.status) && s.date_debut >= maintenant.slice(0, 10) && s.places_restantes > 0).length;
            const st = libelle(STATUTS_FORMATION, f.status);
            return (
              <Link key={f.id} href={`/formations/${f.id}`} className="glass-card p-6 flex flex-col hover:border-indigo-500/30 transition-colors group">
                <div className="flex justify-between items-start gap-2 mb-3">
                  <h3 className="font-semibold text-lg text-white line-clamp-2 group-hover:text-indigo-300 transition-colors">{f.titre}</h3>
                  {admin && <span className={`badge ${st.badge} flex-shrink-0`}>{st.label}</span>}
                </div>
                <p className="text-slate-400 text-sm mb-4 line-clamp-3 flex-grow">{f.description || "Aucune description."}</p>
                <div className="space-y-2 pt-4 border-t border-white/10 text-sm text-slate-400">
                  <div className="flex justify-between gap-2">
                    <span>{f.categorie || "Sans catégorie"} · {NIVEAUX[f.niveau ?? "debutant"] ?? "Débutant"}</span>
                    <span>{f.duree_heures ? `${f.duree_heures} h` : ""}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className={ouvertes > 0 ? "text-emerald-400" : "text-slate-500"}>
                      {ouvertes > 0 ? `${ouvertes} session${ouvertes > 1 ? "s" : ""} ouverte${ouvertes > 1 ? "s" : ""}` : "Aucune session ouverte"}
                    </span>
                    <span className="font-semibold text-white">{f.is_payante && Number(f.prix) > 0 ? fcfa(f.prix) : "Gratuit"}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
