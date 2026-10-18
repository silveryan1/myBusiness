import Link from "next/link";
import type { Metadata } from "next";
import { getContexte, estEquipe } from "@/lib/contexte";
import { dateCourte, un } from "@/lib/format";
import EnTete from "@/components/ui/EnTete";
import Vide from "@/components/ui/Vide";
import SaisieNotes from "@/components/notes/SaisieNotes";
import { mention } from "@/lib/mention";

export const metadata: Metadata = { title: "Notes" };
export const dynamic = "force-dynamic";

export default async function NotesPage({ searchParams }: { searchParams: Promise<{ session?: string }> }) {
  const { session } = await searchParams;
  const { supabase, user, role, orgId } = await getContexte();

  if (!estEquipe(role)) {
    // Étudiant : ses notes, en lecture seule.
    const { data: notes } = await supabase.from("notes")
      .select("id, note, note_max, commentaire, date_evaluation, session:sessions(titre)")
      .eq("etudiant_id", user.id).order("date_evaluation", { ascending: false });
    return (
      <div className="space-y-6 animate-fade-in max-w-3xl">
        <EnTete titre="Mes notes" sousTitre="Notes finales de vos formations" />
        {!notes?.length ? (
          <Vide icone="📝" titre="Aucune note pour l'instant" texte="Vos notes apparaîtront ici dès que votre formateur les aura saisies." />
        ) : (
          <div className="glass-card divide-y divide-white/5">
            {notes.map((n) => {
              const m = mention(Number(n.note), Number(n.note_max));
              return (
                <div key={n.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-white">{un(n.session)?.titre ?? "Session"}</div>
                    <div className="text-xs text-slate-500">{dateCourte(n.date_evaluation)}{n.commentaire ? ` · ${n.commentaire}` : ""}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-white font-bold">{Number(n.note)} / {Number(n.note_max)}</div>
                    <div className={`text-xs font-semibold ${m.couleur}`}>{m.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  let requete = supabase.from("sessions").select("id, titre, organisation_id")
    .eq("organisation_id", orgId ?? "").neq("status", "cancelled").order("date_debut", { ascending: false });
  if (role === "formateur") requete = requete.eq("formateur_id", user.id);
  const { data: sessions } = await requete;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <EnTete titre="Notes" sousTitre="Note finale de chaque étudiant : elle propose la mention du certificat." />
      {!sessions?.length ? (
        <Vide icone="📝" titre="Aucune session" texte={role === "formateur" ? "Aucune session ne vous est attribuée." : "Planifiez d'abord une session."}>
          {role !== "formateur" && <Link href="/sessions/nouveau" className="btn btn-primary">Planifier une session</Link>}
        </Vide>
      ) : (
        <SaisieNotes sessions={sessions} sessionInitiale={session} userId={user.id} />
      )}
    </div>
  );
}
