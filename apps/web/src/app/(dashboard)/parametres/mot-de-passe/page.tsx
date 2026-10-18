import type { Metadata } from "next";
import EnTete from "@/components/ui/EnTete";
import NouveauMotDePasse from "@/components/parametres/NouveauMotDePasse";

export const metadata: Metadata = { title: "Mot de passe" };

export default function MotDePassePage() {
  return (
    <div className="max-w-lg space-y-6 animate-fade-in">
      <EnTete titre="Changer mon mot de passe" retour="/parametres" />
      <div className="glass-card p-6">
        <NouveauMotDePasse apres="/parametres" />
      </div>
    </div>
  );
}
