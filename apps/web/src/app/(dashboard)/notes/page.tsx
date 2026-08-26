"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Session { id: string; titre: string | null; }
interface Inscription { etudiant_id: string; etudiant: { prenom: string; nom: string } | null; }

export default function NotesPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [etudiants, setEtudiants] = useState<Inscription[]>([]);
  const [notes, setNotes] = useState<Record<string, { note: number | string; commentaire: string }>>({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [baremeMax, setBaremeMax] = useState<20 | 100>(20);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("organisation_id, role").eq("id", user.id).single();
      let q = supabase.from("sessions").select("id, titre");
      if (profile?.role === "formateur") q = q.eq("formateur_id", user.id);
      else q = q.eq("organisation_id", profile?.organisation_id || "");
      const { data } = await q;
      setSessions(data || []);
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedSession) return;
    async function loadEtudiants() {
      const supabase = createClient();
      const { data } = await supabase
        .from("inscriptions")
        .select("etudiant_id, etudiant:profiles!inscriptions_etudiant_id_fkey(prenom, nom)")
        .eq("session_id", selectedSession)
        .eq("status", "confirmed");
      setEtudiants((data as unknown as Inscription[]) || []);
      // Load existing notes
      const { data: existing } = await supabase.from("notes").select("etudiant_id, note, commentaire").eq("session_id", selectedSession);
      const map: Record<string, { note: number | string; commentaire: string }> = {};
      existing?.forEach(n => { map[n.etudiant_id] = { note: n.note ?? "", commentaire: n.commentaire || "" }; });
      setNotes(map);
    }
    loadEtudiants();
  }, [selectedSession]);

  function getMention(note: number, max: number) {
    const pct = (note / max) * 100;
    if (pct >= 90) return { label: "Très Bien", color: "text-emerald-400" };
    if (pct >= 75) return { label: "Bien", color: "text-blue-400" };
    if (pct >= 60) return { label: "Assez Bien", color: "text-cyan-400" };
    if (pct >= 50) return { label: "Passable", color: "text-amber-400" };
    return { label: "Insuffisant", color: "text-red-400" };
  }

  async function handleSave() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await Promise.all(
      Object.entries(notes).map(([etudiant_id, val]) =>
        supabase.from("notes").upsert({
          etudiant_id, session_id: selectedSession,
          note: Number(val.note), commentaire: val.commentaire,
          formateur_id: user?.id, bareme: baremeMax,
        }, { onConflict: "etudiant_id,session_id" })
      )
    );
    setSaved(true);
    setLoading(false);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Notes & Évaluations</h1>
        <p className="text-slate-400 mt-1">Évaluez les étudiants par session</p>
      </div>

      <div className="glass-card p-5 flex flex-wrap gap-4">
        <div className="flex-1 min-w-52">
          <label className="form-label">Session</label>
          <select className="form-input" value={selectedSession} onChange={e => setSelectedSession(e.target.value)}>
            <option value="">Sélectionner une session</option>
            {sessions.map(s => <option key={s.id} value={s.id}>{s.titre || "Session"}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Barème</label>
          <select className="form-input" value={baremeMax} onChange={e => setBaremeMax(Number(e.target.value) as 20 | 100)}>
            <option value={20}>Sur 20</option>
            <option value={100}>Sur 100</option>
          </select>
        </div>
      </div>

      {selectedSession && etudiants.length === 0 && (
        <div className="glass-card py-10 text-center text-slate-500">Aucun étudiant inscrit à cette session</div>
      )}

      {etudiants.length > 0 && (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 text-xs uppercase">
                <th className="text-left p-4">Étudiant</th>
                <th className="text-left p-4">Note /{baremeMax}</th>
                <th className="text-left p-4">Mention</th>
                <th className="text-left p-4">Commentaire</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {etudiants.map(({ etudiant_id, etudiant }) => {
                const n = notes[etudiant_id] || { note: "", commentaire: "" };
                const mention = n.note !== "" ? getMention(Number(n.note), baremeMax) : null;
                return (
                  <tr key={etudiant_id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-medium text-white">
                      {etudiant?.prenom} {etudiant?.nom}
                    </td>
                    <td className="p-4">
                      <input
                        type="number" min={0} max={baremeMax} step={0.5}
                        className="form-input w-20 text-center py-1.5"
                        value={n.note}
                        onChange={e => setNotes(prev => ({ ...prev, [etudiant_id]: { ...prev[etudiant_id], note: e.target.value, commentaire: prev[etudiant_id]?.commentaire || "" } }))}
                        placeholder="—"
                      />
                    </td>
                    <td className="p-4">
                      {mention && <span className={`font-semibold ${mention.color}`}>{mention.label}</span>}
                    </td>
                    <td className="p-4">
                      <input
                        type="text" className="form-input py-1.5 text-sm"
                        placeholder="Commentaire..."
                        value={n.commentaire}
                        onChange={e => setNotes(prev => ({ ...prev, [etudiant_id]: { ...prev[etudiant_id], commentaire: e.target.value, note: prev[etudiant_id]?.note ?? "" } }))}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="p-4 border-t border-white/5 flex items-center gap-4">
            <button onClick={handleSave} disabled={loading} className="btn btn-primary btn-sm">
              {loading ? "Sauvegarde..." : "💾 Enregistrer les notes"}
            </button>
            {saved && <span className="text-emerald-400 text-sm">✅ Notes enregistrées !</span>}
          </div>
        </div>
      )}
    </div>
  );
}
