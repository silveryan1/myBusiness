"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Profile { id: string; prenom: string; nom: string; }
interface Session { id: string; titre: string | null; date_debut: string; formation: { titre: string } | { titre: string }[] | null; }
interface Presence { etudiant_id: string; status: string; commentaire: string; }

const statusOptions = [
  { value: "present", label: "Présent ✅", color: "text-emerald-400" },
  { value: "absent", label: "Absent ❌", color: "text-red-400" },
  { value: "retard", label: "Retard ⏰", color: "text-amber-400" },
  { value: "excuse", label: "Excusé 📝", color: "text-blue-400" },
];

export default function PresencesPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [etudiants, setEtudiants] = useState<Profile[]>([]);
  const [presences, setPresences] = useState<Record<string, Presence>>({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    async function loadSessions() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("organisation_id, role")
        .eq("id", user.id)
        .single();

      let q = supabase
        .from("sessions")
        .select("id, titre, date_debut, formation:formations(titre)")
        .in("status", ["scheduled", "ongoing"]);

      if (profile?.role === "formateur") {
        q = q.eq("formateur_id", user.id);
      } else {
        q = q.eq("organisation_id", profile?.organisation_id || "");
      }

      const { data } = await q.order("date_debut");
      setSessions(data || []);
    }
    loadSessions();
  }, []);

  useEffect(() => {
    if (!selectedSession) return;

    async function loadEtudiants() {
      const supabase = createClient();
      const { data: inscriptions } = await supabase
        .from("inscriptions")
        .select("etudiant:profiles(id, prenom, nom)")
        .eq("session_id", selectedSession)
        .eq("status", "confirmed");

      const students = (inscriptions || []).map((i) => i.etudiant as unknown as Profile);
      setEtudiants(students);

      // Charger les présences existantes pour cette date
      const { data: existing } = await supabase
        .from("presences")
        .select("etudiant_id, status, commentaire")
        .eq("session_id", selectedSession)
        .eq("date_presence", date);

      const presMap: Record<string, Presence> = {};
      (existing || []).forEach((p) => {
        presMap[p.etudiant_id] = p;
      });
      setPresences(presMap);
    }
    loadEtudiants();
  }, [selectedSession, date]);

  function setStatus(studentId: string, status: string) {
    setPresences((prev) => ({
      ...prev,
      [studentId]: { etudiant_id: studentId, status, commentaire: prev[studentId]?.commentaire || "" },
    }));
  }

  async function handleSave() {
    if (!selectedSession) return;
    setLoading(true);
    setSaved(false);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("organisation_id")
      .eq("id", user.id)
      .single();

    const records = Object.values(presences).map((p) => ({
      organisation_id: profile?.organisation_id,
      session_id: selectedSession,
      etudiant_id: p.etudiant_id,
      formateur_id: user.id,
      status: p.status,
      date_presence: date,
      commentaire: p.commentaire || null,
    }));

    await supabase.from("presences").upsert(records, {
      onConflict: "session_id,etudiant_id,date_presence",
    });

    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const presentCount = Object.values(presences).filter((p) => p.status === "present").length;
  const absentCount = Object.values(presences).filter((p) => p.status === "absent").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Suivi des présences</h1>
        <p className="text-slate-400 mt-1">Enregistrez les présences pour chaque session</p>
      </div>

      {/* Filtres */}
      <div className="glass-card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Session</label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="form-input"
            >
              <option value="">Sélectionner une session</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {(Array.isArray(s.formation) ? s.formation[0]?.titre : s.formation?.titre) || s.titre || "Session"} —{" "}
                  {new Date(s.date_debut).toLocaleDateString("fr-FR")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Date de présence</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="form-input"
            />
          </div>
        </div>
      </div>

      {/* Liste étudiants */}
      {selectedSession && (
        <>
          {etudiants.length === 0 ? (
            <div className="glass-card py-12 text-center">
              <div className="text-3xl mb-3">👥</div>
              <p className="text-slate-400">Aucun étudiant confirmé pour cette session</p>
            </div>
          ) : (
            <>
              {/* Stats rapides */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="badge badge-success">✅ {presentCount} présents</div>
                <div className="badge badge-error">❌ {absentCount} absents</div>
                <div className="badge badge-info">👥 {etudiants.length} total</div>
              </div>

              <div className="glass-card overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <h2 className="font-semibold text-white">Étudiants inscrits</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => etudiants.forEach((e) => setStatus(e.id, "present"))}
                      className="btn btn-ghost btn-sm text-emerald-400"
                    >
                      Tous présents
                    </button>
                    <button
                      onClick={() => etudiants.forEach((e) => setStatus(e.id, "absent"))}
                      className="btn btn-ghost btn-sm text-red-400"
                    >
                      Tous absents
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-white/5">
                  {etudiants.map((etudiant) => {
                    const p = presences[etudiant.id];
                    return (
                      <div key={etudiant.id} className="flex items-center justify-between p-4 hover:bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                            {etudiant.prenom?.[0]?.toUpperCase()}
                          </div>
                          <span className="text-white font-medium">{etudiant.prenom} {etudiant.nom}</span>
                        </div>
                        <div className="flex gap-2">
                          {statusOptions.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => setStatus(etudiant.id, opt.value)}
                              className={`btn btn-sm transition-all ${
                                p?.status === opt.value
                                  ? "btn-primary scale-105"
                                  : "btn-ghost opacity-50 hover:opacity-100"
                              }`}
                              title={opt.label}
                            >
                              {opt.label.split(" ")[1]}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  className="btn btn-primary btn-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <><div className="spinner" /> Enregistrement...</>
                  ) : saved ? (
                    <><span>✅</span> Enregistré !</>
                  ) : (
                    "Enregistrer les présences"
                  )}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
