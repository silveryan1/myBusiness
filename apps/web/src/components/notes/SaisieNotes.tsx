"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { mention } from "@/lib/mention";

type Session = { id: string; titre: string | null; organisation_id: string };
type Ligne = { etudiant_id: string; prenom: string; nom: string; note: string; commentaire: string };

/** Note finale de chaque étudiant confirmé d'une session (sur 20 ou sur 100). */
export default function SaisieNotes({ sessions, sessionInitiale, userId }: { sessions: Session[]; sessionInitiale?: string; userId: string }) {
  const [sessionId, setSessionId] = useState(sessions.some((s) => s.id === sessionInitiale) ? (sessionInitiale as string) : "");
  const [bareme, setBareme] = useState<20 | 100>(20);
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [chargement, setChargement] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    let annule = false;
    (async () => {
      setChargement(true);
      setMessage(null);
      const supabase = createClient();
      const [{ data: ins }, { data: notes }] = await Promise.all([
        supabase.from("inscriptions").select("etudiant_id, etudiant:profiles!inscriptions_etudiant_id_fkey(prenom, nom)")
          .eq("session_id", sessionId).in("status", ["confirmed", "completed"]),
        supabase.from("notes").select("etudiant_id, note, note_max, commentaire").eq("session_id", sessionId),
      ]);
      if (annule) return;
      const parEtudiant = new Map((notes ?? []).map((n) => [n.etudiant_id, n]));
      const max = Number(notes?.[0]?.note_max) === 100 ? 100 : 20;
      setBareme(max);
      setLignes((ins ?? []).map((i) => {
        const e = Array.isArray(i.etudiant) ? i.etudiant[0] : i.etudiant;
        const n = parEtudiant.get(i.etudiant_id);
        return {
          etudiant_id: i.etudiant_id as string, prenom: e?.prenom ?? "", nom: e?.nom ?? "",
          note: n ? String(Number(n.note)) : "", commentaire: n?.commentaire ?? "",
        };
      }).sort((a, b) => a.nom.localeCompare(b.nom)));
      setChargement(false);
    })();
    return () => { annule = true; };
  }, [sessionId]);

  const maj = (id: string, champ: "note" | "commentaire", v: string) =>
    setLignes((p) => p.map((l) => (l.etudiant_id === id ? { ...l, [champ]: v } : l)));

  async function enregistrer() {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;
    const remplies = lignes.filter((l) => l.note.trim() !== "");
    const horsBornes = remplies.find((l) => !(Number(l.note) >= 0 && Number(l.note) <= bareme));
    if (horsBornes) {
      setMessage({ ok: false, texte: `Note de ${horsBornes.prenom} ${horsBornes.nom} hors barème (0 à ${bareme}).` });
      return;
    }
    setEnvoi(true);
    const { error } = await createClient().from("notes").upsert(remplies.map((l) => ({
      organisation_id: session.organisation_id,
      session_id: sessionId,
      etudiant_id: l.etudiant_id,
      formateur_id: userId,
      note: Number(l.note),
      note_max: bareme,
      type_evaluation: "Note finale",
      commentaire: l.commentaire.trim().slice(0, 500) || null,
      date_evaluation: new Date().toISOString().slice(0, 10),
    })), { onConflict: "session_id,etudiant_id" });
    setEnvoi(false);
    setMessage(error
      ? { ok: false, texte: "Enregistrement refusé : vérifiez votre connexion." }
      : { ok: true, texte: `${remplies.length} note${remplies.length > 1 ? "s" : ""} enregistrée${remplies.length > 1 ? "s" : ""}.` });
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className="form-label" htmlFor="session">Session</label>
          <select id="session" className="form-input" value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
            <option value="">Choisir une session</option>
            {sessions.map((s) => <option key={s.id} value={s.id}>{s.titre || "Session"}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label" htmlFor="bareme">Barème</label>
          <select id="bareme" className="form-input" value={bareme} onChange={(e) => setBareme(Number(e.target.value) === 100 ? 100 : 20)}>
            <option value={20}>Sur 20</option>
            <option value={100}>Sur 100</option>
          </select>
        </div>
      </div>

      {sessionId && (
        <div className="glass-card overflow-hidden">
          {chargement ? (
            <p className="p-6 text-sm text-slate-500">Chargement…</p>
          ) : lignes.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">Aucun étudiant confirmé dans cette session.</p>
          ) : (
            <>
              <div className="divide-y divide-white/5">
                {lignes.map((l) => {
                  const m = l.note.trim() !== "" && Number.isFinite(Number(l.note)) ? mention(Number(l.note), bareme) : null;
                  return (
                    <div key={l.etudiant_id} className="p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:items-center">
                      <div className="sm:col-span-4 text-white font-medium">{l.prenom} {l.nom}</div>
                      <div className="sm:col-span-3 flex items-center gap-2">
                        <input type="number" min={0} max={bareme} step={0.25} inputMode="decimal" className="form-input w-24 text-center py-1.5"
                          value={l.note} onChange={(e) => maj(l.etudiant_id, "note", e.target.value)} placeholder="—" aria-label={`Note de ${l.prenom} ${l.nom}`} />
                        <span className="text-slate-500 text-sm">/ {bareme}</span>
                      </div>
                      <div className={`sm:col-span-2 text-sm font-semibold ${m?.couleur ?? ""}`}>{m?.label ?? ""}</div>
                      <input className="sm:col-span-3 form-input py-1.5 text-sm" maxLength={500} placeholder="Commentaire"
                        value={l.commentaire} onChange={(e) => maj(l.etudiant_id, "commentaire", e.target.value)} />
                    </div>
                  );
                })}
              </div>
              <div className="p-4 border-t border-white/5 flex flex-wrap items-center gap-4">
                <button type="button" onClick={enregistrer} disabled={envoi} className="btn btn-primary btn-sm">
                  {envoi ? "Enregistrement…" : "💾 Enregistrer les notes"}
                </button>
                {message && <span className={`text-sm ${message.ok ? "text-emerald-400" : "text-red-400"}`}>{message.texte}</span>}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
