import Link from "next/link";
import type { Metadata } from "next";
import { getContexte, estAdmin } from "@/lib/contexte";
import { dateCourte, fcfa, un, nomComplet } from "@/lib/format";
import { METHODES_PAIEMENT, STATUTS_PAIEMENT, libelle } from "@/lib/libelles";
import EnTete from "@/components/ui/EnTete";
import Vide from "@/components/ui/Vide";
import Stat from "@/components/ui/Stat";

export const metadata: Metadata = { title: "Paiements" };
export const dynamic = "force-dynamic";

export default async function PaiementsPage() {
  const { supabase, user, role, orgId } = await getContexte();
  const admin = estAdmin(role);
  const org = orgId ?? "";

  let reqPaie = supabase.from("paiements")
    .select("id, recu_numero, montant, methode, reference, status, date_paiement, etudiant:profiles!paiements_etudiant_id_fkey(prenom, nom), inscription:inscriptions(session:sessions(titre))")
    .eq("organisation_id", org)
    .order("date_paiement", { ascending: false })
    .limit(200);
  if (!admin) reqPaie = reqPaie.eq("etudiant_id", user.id);

  // Restes à payer : inscriptions confirmées/terminées d'une formation payante.
  let reqDus = supabase.from("inscriptions")
    .select("id, etudiant:profiles!inscriptions_etudiant_id_fkey(prenom, nom), session:sessions(titre, formation:formations(prix, is_payante)), paiements(montant, status)")
    .eq("organisation_id", org)
    .in("status", ["confirmed", "completed"]);
  if (!admin) reqDus = reqDus.eq("etudiant_id", user.id);

  const [{ data: paiements }, { data: inscriptions }] = await Promise.all([reqPaie, reqDus]);
  const liste = paiements ?? [];

  const soldes = (inscriptions ?? []).map((i) => {
    const s = un(i.session);
    const f = un(s?.formation ?? null);
    const prix = f?.is_payante ? Number(f.prix) || 0 : 0;
    const paye = (i.paiements ?? []).filter((p) => p.status === "paid").reduce((t, p) => t + Number(p.montant), 0);
    return { id: i.id, etudiant: nomComplet(un(i.etudiant)), session: s?.titre ?? "Session", prix, paye, reste: Math.max(0, prix - paye) };
  }).filter((x) => x.reste > 0).sort((a, b) => b.reste - a.reste);

  const encaisses = liste.filter((p) => p.status === "paid");
  const total = encaisses.reduce((t, p) => t + Number(p.montant), 0);
  const debutMois = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const ceMois = encaisses.filter((p) => (p.date_paiement ?? "") >= debutMois).reduce((t, p) => t + Number(p.montant), 0);
  const momo = encaisses.filter((p) => p.methode === "mtn_momo" || p.methode === "orange_money").reduce((t, p) => t + Number(p.montant), 0);
  const resteTotal = soldes.reduce((t, x) => t + x.reste, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <EnTete titre={admin ? "Paiements" : "Mes paiements"}
        sousTitre={admin ? "Encaissements en FCFA, reçus numérotés et restes à payer" : "Vos règlements et vos reçus"}>
        {admin && <Link href="/paiements/nouveau" className="btn btn-primary">+ Enregistrer un paiement</Link>}
      </EnTete>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {admin ? (
          <>
            <Stat label="Encaissé ce mois" valeur={fcfa(ceMois)} icone="📆" couleur="from-emerald-500 to-teal-600" />
            <Stat label="Encaissé au total" valeur={fcfa(total)} icone="💰" />
            <Stat label="Dont Mobile Money" valeur={fcfa(momo)} icone="📱" couleur="from-amber-500 to-orange-600" />
            <Stat label="Reste à encaisser" valeur={fcfa(resteTotal)} icone="⏳" couleur="from-red-500 to-pink-600" sous={`${soldes.length} inscription${soldes.length > 1 ? "s" : ""}`} />
          </>
        ) : (
          <>
            <Stat label="Total payé" valeur={fcfa(total)} icone="💰" couleur="from-emerald-500 to-teal-600" />
            <Stat label="Reste à payer" valeur={fcfa(resteTotal)} icone="⏳" couleur="from-amber-500 to-orange-600" />
          </>
        )}
      </div>

      {soldes.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <h2 className="font-semibold text-white">Restes à payer</h2>
          </div>
          <div className="divide-y divide-white/5">
            {soldes.map((x) => (
              <div key={x.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-white">{admin ? `${x.etudiant} — ` : ""}{x.session}</div>
                  <div className="text-xs text-slate-500">Payé {fcfa(x.paye)} sur {fcfa(x.prix)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-amber-400 font-semibold">{fcfa(x.reste)}</span>
                  {admin && <Link href={`/paiements/nouveau?inscription=${x.id}`} className="btn btn-secondary btn-sm">Encaisser</Link>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {liste.length === 0 ? (
        <Vide icone="💳" titre="Aucun paiement enregistré"
          texte={admin ? "Enregistrez chaque règlement (espèces, MTN Mobile Money, Orange Money, virement) : un reçu numéroté est créé automatiquement." : "Vos reçus apparaîtront ici après chaque règlement au centre."}>
          {admin && <Link href="/paiements/nouveau" className="btn btn-primary">Enregistrer un paiement</Link>}
        </Vide>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <h2 className="font-semibold text-white">Historique</h2>
          </div>
          <div className="divide-y divide-white/5">
            {liste.map((p) => {
              const st = libelle(STATUTS_PAIEMENT, p.status);
              const session = un(un(p.inscription)?.session ?? null);
              return (
                <Link key={p.id} href={`/paiements/${p.id}`} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-white/[0.03]">
                  <div className="min-w-0">
                    <div className="text-white">
                      {admin ? `${nomComplet(un(p.etudiant))} — ` : ""}{session?.titre ?? "Formation"}
                    </div>
                    <div className="text-xs text-slate-500 flex flex-wrap gap-x-3">
                      <span>{p.recu_numero}</span>
                      <span>{dateCourte(p.date_paiement)}</span>
                      <span>{METHODES_PAIEMENT[p.methode ?? ""] ?? "—"}{p.reference ? ` · réf. ${p.reference}` : ""}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`badge ${st.badge}`}>{st.label}</span>
                    <span className={`font-semibold ${p.status === "paid" ? "text-white" : "text-slate-500 line-through"}`}>{fcfa(p.montant)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
