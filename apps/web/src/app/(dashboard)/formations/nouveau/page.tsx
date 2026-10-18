import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getContexte, estAdmin } from "@/lib/contexte";
import EnTete from "@/components/ui/EnTete";
import FormulaireFormation from "@/components/formations/FormulaireFormation";

export const metadata: Metadata = { title: "Nouvelle formation" };

export default async function NouvelleFormationPage() {
  const { role } = await getContexte();
  if (!estAdmin(role)) redirect("/formations");
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <EnTete titre="Nouvelle formation" sousTitre="Elle reste en brouillon tant que vous ne la publiez pas." retour="/formations" />
      <FormulaireFormation />
    </div>
  );
}
