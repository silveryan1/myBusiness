import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getContexte, estAdmin } from "@/lib/contexte";
import EnTete from "@/components/ui/EnTete";
import Vide from "@/components/ui/Vide";
import FormulaireSession from "@/components/sessions/FormulaireSession";

export const metadata: Metadata = { title: "Nouvelle session" };

export default async function NouvelleSessionPage({ searchParams }: { searchParams: Promise<{ formation?: string }> }) {
  const { formation } = await searchParams;
  const { supabase, role, orgId } = await getContexte();
  if (!estAdmin(role)) redirect("/sessions");
  const [{ data: formations }, { data: formateurs }] = await Promise.all([
    supabase.from("formations").select("id, titre").eq("organisation_id", orgId ?? "").neq("status", "archived").order("titre"),
    supabase.from("profiles").select("id, prenom, nom").eq("organisation_id", orgId ?? "").eq("role", "formateur").eq("is_active", true).order("nom"),
  ]);
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <EnTete titre="Nouvelle session" sousTitre="Une session est une édition datée d'une formation." retour="/sessions" />
      {!formations?.length ? (
        <Vide icone="🎓" titre="Créez d'abord une formation" texte="Une session se rattache toujours à une formation du catalogue.">
          <Link href="/formations/nouveau" className="btn btn-primary">Créer une formation</Link>
        </Vide>
      ) : (
        <FormulaireSession formations={formations} formateurs={formateurs ?? []} formationInitiale={formation} />
      )}
    </div>
  );
}
