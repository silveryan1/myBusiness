"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Session = { id: string; titre: string | null; date_debut: string; organisation_id: string };
type Etudiant = { etudiant_id: string; prenom: string; nom: string };
type Statut = "present" | "absent" | "retard" | "excuse";

const STATUTS: { cle: Statut; label: string; icone: string; actif: string }[] = [
  { cle: "present", label: "Présent", icone: "✓", actif: "bg-emerald-500/20 text-emerald-300 border-emerald-500/50" },
  { cle: "retard", label: "Retard", icone: "⏱", actif: "bg-amber-500/20 text-amber-300 border-amber-500/50" },
  { cle: "absent", label: "Absent", icone: "✗", actif: "bg-red-500/20 text-red-300 border-red-500/50" },
  { cle: "excuse", label: "Excusé", icone: "✉", actif: "bg-sky-500/20 text-sky-300 border-sky-500/50" },
];

function aujourdhui() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Feuille d'appel : une ligne par étudiant confirmé, un statut par jour. */
export default function Appel({ sessions, sessionInitiale, userId }: { sessions: Session[]; sessionInitiale?: string; userId: string }) {
  const [sessionId, setSessionId] = useState(sessions.some((s) => s.id === sessionInitiale) ? (sessionInitiale as string) : "");
  const [jour, setJour] = useState(aujourdhui());
  const [etudiants, setEtudiants] = useState<Etudiant[]>([]);
  const [statuts, setStatuts] = useState<Record<string, Statut>>({});
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    if (!sessionId) return;
    let annule = false;
    (async () => {
      setChargement(true);
      setErreur("");
      const supabase = createClient();
      const [{ data: ins, error: e1 }, { data: pres, error: e2 }] = await Promise.all([
        supabase.from("inscriptions")
          .select("etudiant_id, etudiant:profiles!inscriptions_etudiant_id_fkey(prenom, nom)")
          .eq("session_id", sessionId).in("status", ["confirmed", "completed"]),
        supabase.from("presences").select("etudiant_id, status").eq("session_id", sessionId).eq("date_presence", jour),
      ]);
      if (annule) return;
      if (e1 || e2) setErreur("Chargement impossible.");
      setEtudiants((ins ?? []).map((i) => {
        const e = Array.isArray(i.etudiant) ? i.etudiant[0] : i.etudiant;
        return { etudiant_id: i.etudiant_id as string, prenom: e?.prenom ?? "", nom: e?.nom ?? "" };
      }).sort((x, y) => x.nom.localeCompare(y.nom)));
      setStatuts(Object.fromEntries((pres ?? []).map((p) => [p.etudiant_id, p.status as Statut])));
      setChargement(false);
    })();
    return () => { annule = true; };
  }, [sessionId, jour]);

  async function marquer(etudiantId: string, statut: Statut) {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;
    const avant = statuts[etudiantId];
    setStatuts((p) => ({ ...p, [etudiantId]: statut }));
    const maintenant = new Date();
    const { error } = await createClient().from("presences").upsert({
      organisation_id: session.organisation_id,
      session_id: sessionId,
      etudiant_id: etudiantId,
      formateur_id: userId,
      status: statut,
      date_presence: jour,
      heure_arrivee: statut === "present" || statut === "retard"
        ? `${String(maintenant.getHours()).padStart(2, "0")}:${String(maintenant.getMinutes()).padStart(2, "0")}`
        : null,
    }, { onConflict: "session_id,etudiant_id,date_presence" });
    if (error) {
      setStatuts((p) => {
        const copie = { ...p };
        if (avant) copie[etudiantId] = avant; else delete copie[etudiantId];
        return copie;
      });
      setErreur("Enregistrement refusé : vérifiez votre connexion.");
    }
  }

  async function tousPresents() {
    for (const e of etudiants) if (!statuts[e.etudiant_id]) await marquer(e.etudiant_id, "present");
  }

  const compte = (s: Statut) => Object.values(statuts).filter((x) => x === s).length;

  return (
    <div className="space-y-6">
      <div className="glass-card p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className="form-label" htmlFor="session">Session</label>
          <select id="session" className="form-input" value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
            <option value="">Choisir une session</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.titre || "Session"} — {new Date(s.date_debut).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label" htmlFor="jour">Date</label>
          <input id="jour" type="date" className="form-input" value={jour} max={aujourdhui()} onChange={(e) => setJour(e.target.value || aujourdhui())} />
        </div>
      </div>

      {sessionId && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STATUTS.map((s) => (
              <div key={s.cle} className="stat-card text-center">
                <div className="text-2xl font-bold text-white">{compte(s.cle)}</div>
                <div className="text-xs text-slate-400">{s.label}{compte(s.cle) > 1 ? "s" : ""}</div>
              </div>
            ))}
          </div>

          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center justify-between gap-3">
              <h2 className="font-semibold text-white">
                Étudiants ({etudiants.length}) {chargement && <span className="text-xs text-slate-500">chargement…</span>}
              </h2>
              {etudiants.length > 0 && Object.keys(statuts).length < etudiants.length && (
                <button type="button" onClick={tousPresents} className="btn btn-secondary btn-sm">Marquer les autres présents</button>
              )}
            </div>
            {erreur && <p className="px-4 pt-3 text-sm text-red-400">{erreur}</p>}
            {etudiants.length === 0 && !chargement ? (
              <p className="p-6 text-sm text-slate-500">Aucun étudiant confirmé dans cette session.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {etudiants.map((e) => (
                  <div key={e.etudiant_id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-white font-medium">{e.prenom} {e.nom}</div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {STATUTS.map((s) => (
                        <button key={s.cle} type="button" onClick={() => marquer(e.etudiant_id, s.cle)}
                          className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-all ${
                            statuts[e.etudiant_id] === s.cle ? s.actif : "bg-white/[0.03] text-slate-400 border-white/10 hover:text-white"
                          }`}>
                          {s.icone} {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
