import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getContexte, estAdmin } from "@/lib/contexte";
import EnTete from "@/components/ui/EnTete";
import FormulaireFormation from "@/components/formations/FormulaireFormation";

export const metadata: Metadata = { title: "Modifier la formation" };

export default async function ModifierFormationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, role, orgId } = await getContexte();
  if (!estAdmin(role)) redirect(`/formations/${id}`);
  const { data: f } = await supabase.from("formations").select("*").eq("id", id).eq("organisation_id", orgId ?? "").single();
  if (!f) notFound();
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <EnTete titre="Modifier la formation" sousTitre={f.titre} retour={`/formations/${id}`} />
      <FormulaireFormation id={id} initial={{
        titre: f.titre ?? "", description: f.description ?? "", objectifs: f.objectifs ?? "", prerequis: f.prerequis ?? "",
        duree_heures: f.duree_heures ? String(f.duree_heures) : "", niveau: f.niveau ?? "debutant",
        categorie: f.categorie ?? "", is_payante: !!f.is_payante, prix: f.prix ? String(Math.round(Number(f.prix))) : "",
      }} />
    </div>
  );
}
