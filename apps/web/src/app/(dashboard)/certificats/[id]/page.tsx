import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getContexte, estAdmin } from "@/lib/contexte";
import { dateLongue, un, nomComplet } from "@/lib/format";
import { revoquerCertificat } from "@/app/actions/certificat";
import EnTete from "@/components/ui/EnTete";
import BoutonAction from "@/components/ui/BoutonAction";
import BoutonImprimer from "@/components/ui/BoutonImprimer";

export const metadata: Metadata = { title: "Certificat" };
export const dynamic = "force-dynamic";

/** Adresse publique du site, pour l'URL de vérification imprimée sur le certificat. */
async function origine() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  const h = await headers();
  const hote = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (hote.startsWith("localhost") ? "http" : "https");
  return `${proto}://${hote}`;
}

export default async function CertificatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, role, orgId } = await getContexte();
  const admin = estAdmin(role);

  const { data: c } = await supabase.from("certificats")
    .select("*, etudiant:profiles!certificats_etudiant_id_fkey(prenom, nom), signataire:profiles!certificats_delivre_par_fkey(prenom, nom), session:sessions(titre, date_debut, date_fin, formation:formations(titre, duree_heures)), organisation:organisations(nom, ville)")
    .eq("id", id).eq("organisation_id", orgId ?? "").single();
  if (!c) notFound();

  const etudiant = un(c.etudiant);
  const signataire = un(c.signataire);
  const session = un(c.session);
  const formation = un(session?.formation ?? null);
  const org = un(c.organisation);
  const lien = `${await origine()}/verifier/${c.code_verification}`;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="no-print">
        <EnTete titre={`Certificat ${c.numero}`} retour="/certificats">
          <BoutonImprimer />
          {admin && c.is_valide && (
            <BoutonAction action={revoquerCertificat.bind(null, id)} libelle="Révoquer"
              confirmer="Confirmer la révocation" className="btn btn-ghost btn-sm" />
          )}
        </EnTete>
        {!c.is_valide && <p className="text-sm text-red-400 mt-3">Ce certificat a été révoqué : la page de vérification l&apos;indique.</p>}
      </div>

      <article className="document-imprimable bg-white text-slate-900 rounded-2xl shadow-2xl p-3 sm:p-4">
        <div className="border-4 border-double border-indigo-900/70 rounded-xl px-6 py-10 sm:px-12 sm:py-14 text-center space-y-6 relative">
          {!c.is_valide && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-6xl font-black text-red-600/25 -rotate-12 uppercase">Révoqué</span>
            </div>
          )}
          <div className="text-sm uppercase tracking-[0.3em] text-indigo-900/80">{org?.nom ?? "Centre de formation"}</div>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-indigo-950">Certificat de formation</h1>
          <p className="text-slate-600">Le présent certificat est décerné à</p>
          <div className="text-2xl sm:text-4xl font-serif font-semibold border-b border-slate-300 inline-block px-6 pb-2">{nomComplet(etudiant)}</div>
          <p className="text-slate-700 max-w-2xl mx-auto">
            pour avoir suivi avec succès la formation{" "}
            <span className="font-semibold">« {formation?.titre ?? session?.titre ?? "—"} »</span>
            {formation?.duree_heures ? ` (${formation.duree_heures} heures)` : ""}
            {session?.date_debut ? `, du ${dateLongue(session.date_debut)} au ${dateLongue(session.date_fin)}` : ""}.
          </p>
          {c.mention && <p className="text-lg">Mention : <span className="font-semibold">{c.mention}</span></p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 text-sm text-slate-600 items-end">
            <div className="sm:text-left">
              <div>Fait à {org?.ville || "………………"}, le {dateLongue(c.date_delivrance)}</div>
              <div className="mt-1">N° <span className="font-mono text-slate-900">{c.numero}</span></div>
            </div>
            <div className="sm:text-right">
              <div>La direction{signataire ? ` — ${nomComplet(signataire)}` : ""}</div>
              <div className="h-14" />
            </div>
          </div>
          <div className="pt-4 border-t border-slate-200 text-xs text-slate-500">
            Authenticité vérifiable sur <span className="font-mono text-slate-700 break-all">{lien}</span>
            {" "}· code <span className="font-mono font-semibold text-slate-800">{c.code_verification}</span>
          </div>
        </div>
      </article>
    </div>
  );
}
