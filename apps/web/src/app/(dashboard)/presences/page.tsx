import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getContexte, estEquipe } from "@/lib/contexte";
import EnTete from "@/components/ui/EnTete";
import Vide from "@/components/ui/Vide";
import Appel from "@/components/presences/Appel";

export const metadata: Metadata = { title: "Présences" };
export const dynamic = "force-dynamic";

export default async function PresencesPage({ searchParams }: { searchParams: Promise<{ session?: string }> }) {
  const { session } = await searchParams;
  const { supabase, user, role, orgId } = await getContexte();
  if (!estEquipe(role)) redirect("/dashboard");

  let requete = supabase.from("sessions").select("id, titre, date_debut, organisation_id")
    .eq("organisation_id", orgId ?? "").in("status", ["scheduled", "ongoing", "completed"])
    .order("date_debut", { ascending: false });
  if (role === "formateur") requete = requete.eq("formateur_id", user.id);
  const { data: sessions } = await requete;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <EnTete titre="Présences" sousTitre="Faites l'appel : chaque clic est enregistré tout de suite." />
      {!sessions?.length ? (
        <Vide icone="✅" titre="Aucune session" texte={role === "formateur" ? "Aucune session ne vous est attribuée." : "Planifiez d'abord une session."}>
          {role !== "formateur" && <Link href="/sessions/nouveau" className="btn btn-primary">Planifier une session</Link>}
        </Vide>
      ) : (
        <Appel sessions={sessions} sessionInitiale={session} userId={user.id} />
      )}
    </div>
  );
}
