import Link from "next/link";
import type { Metadata } from "next";
import { getContexte, estAdmin } from "@/lib/contexte";
import { dateCourte, un, nomComplet } from "@/lib/format";
import { STATUTS_INSCRIPTION, libelle } from "@/lib/libelles";
import { mention } from "@/lib/mention";
import EnTete from "@/components/ui/EnTete";
import Vide from "@/components/ui/Vide";
import DelivrerCertificat from "@/components/certificats/DelivrerCertificat";

export const metadata: Metadata = { title: "Certificats" };
export const dynamic = "force-dynamic";

/** Mention suggérée d'après la note finale (« Insuffisant » : pas de mention). */
function mentionPour(note?: number | null, max?: number | null): string | undefined {
  if (note == null || !max) return undefined;
  const m = mention(Number(note), Number(max)).label;
  return m === "Insuffisant" ? "" : m;
}

export default async function CertificatsPage({ searchParams }: { searchParams: Promise<{ inscription?: string }> }) {
  const { inscription: cible } = await searchParams;
  const { supabase, user, role, orgId } = await getContexte();
  const admin = estAdmin(role);
  const org = orgId ?? "";

  let reqCert = supabase.from("certificats")
    .select("id, numero, date_delivrance, mention, is_valide, session_id, etudiant_id, etudiant:profiles!certificats_etudiant_id_fkey(prenom, nom), session:sessions(titre, formation:formations(titre))")
    .eq("organisation_id", org).order("date_delivrance", { ascending: false });
  if (!admin) reqCert = reqCert.eq("etudiant_id", user.id);
  const { data: certificats } = await reqCert;
  const liste = certificats ?? [];

  // Administration : inscriptions qui ouvrent droit à un certificat et n'en ont pas encore.
  let eligibles: { id: string; nom: string; session: string; statut: string; mention?: string; note?: string }[] = [];
  if (admin) {
    const [{ data: ins }, { data: notes }] = await Promise.all([
      supabase.from("inscriptions")
        .select("id, status, session_id, etudiant_id, etudiant:profiles!inscriptions_etudiant_id_fkey(prenom, nom), session:sessions(titre, status, formation:formations(titre))")
        .eq("organisation_id", org).in("status", ["confirmed", "completed"]),
      supabase.from("notes").select("session_id, etudiant_id, note, note_max").eq("organisation_id", org),
    ]);
    const deja = new Set(liste.map((c) => `${c.session_id}|${c.etudiant_id}`));
    const noteDe = new Map((notes ?? []).map((n) => [`${n.session_id}|${n.etudiant_id}`, n]));
    eligibles = (ins ?? [])
      .filter((i) => !deja.has(`${i.session_id}|${i.etudiant_id}`))
      .map((i) => {
        const s = un(i.session);
        const n = noteDe.get(`${i.session_id}|${i.etudiant_id}`);
        return {
          id: i.id,
          nom: nomComplet(un(i.etudiant)),
          session: s?.titre || un(s?.formation ?? null)?.titre || "Session",
          statut: i.status,
          mention: mentionPour(n?.note, n?.note_max),
          note: n ? `${Number(n.note)}/${Number(n.note_max)}` : undefined,
        };
      })
      // L'inscription ciblée (lien depuis « Inscriptions ») en premier.
      .sort((a, b) => (a.id === cible ? -1 : b.id === cible ? 1 : a.nom.localeCompare(b.nom)));
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <EnTete titre={admin ? "Certificats" : "Mes certificats"}
        sousTitre={admin ? "Délivrez les certificats ; chacun porte un code vérifiable en ligne" : "Imprimez vos certificats ; chacun porte un code vérifiable en ligne"}>
        <Link href="/verifier" className="btn btn-secondary btn-sm">🔎 Vérifier un certificat</Link>
      </EnTete>

      {admin && (
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <h2 className="font-semibold text-white">À délivrer</h2>
            <p className="text-xs text-slate-500 mt-1">Inscriptions confirmées ou terminées sans certificat. La mention proposée vient de la note finale.</p>
          </div>
          {eligibles.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">Aucune inscription en attente de certificat.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {eligibles.map((e) => (
                <div key={e.id} className={`p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${e.id === cible ? "bg-indigo-500/10" : ""}`}>
                  <div className="min-w-0">
                    <div className="text-white">{e.nom} — {e.session}</div>
                    <div className="text-xs text-slate-500 flex gap-3">
                      <span>{libelle(STATUTS_INSCRIPTION, e.statut).label}</span>
                      <span>{e.note ? `Note finale ${e.note}` : "Pas de note finale"}</span>
                    </div>
                  </div>
                  <DelivrerCertificat inscriptionId={e.id} mentionProposee={e.mention} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {liste.length === 0 ? (
        <Vide icone="🏅" titre="Aucun certificat délivré"
          texte={admin ? "Les certificats délivrés apparaîtront ici." : "Votre certificat apparaîtra ici quand le centre l'aura délivré, à la fin de votre formation."} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {liste.map((c) => {
            const s = un(c.session);
            return (
              <Link key={c.id} href={`/certificats/${c.id}`} className="glass-card p-5 hover:border-indigo-500/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-white font-semibold">{un(s?.formation ?? null)?.titre ?? s?.titre ?? "Formation"}</div>
                    {admin && <div className="text-sm text-slate-300">{nomComplet(un(c.etudiant))}</div>}
                    <div className="text-xs text-slate-500 mt-1">{c.numero} · {dateCourte(c.date_delivrance)}{c.mention ? ` · ${c.mention}` : ""}</div>
                  </div>
                  <span className={`badge ${c.is_valide ? "badge-success" : "badge-error"} flex-shrink-0`}>{c.is_valide ? "Valide" : "Révoqué"}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
