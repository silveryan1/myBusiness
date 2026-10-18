import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import SansOrganisation from "@/components/SansOrganisation";
import { creerOrganisationPour } from "@/lib/organisation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Récupérer le profil complet avec organisation
  let { data: profile } = await supabase
    .from("profiles")
    .select("*, organisation:organisations(*)")
    .eq("id", user.id)
    .single();

  // Première connexion d'un compte créé depuis « Créer un compte » : l'organisation saisie à
  // l'inscription est créée maintenant (l'utilisateur est connecté, donc identifié de façon sûre).
  const nomOrg = typeof user.user_metadata?.organisation_nom === "string" ? user.user_metadata.organisation_nom : "";
  if (profile && !profile.organisation_id && profile.role !== "super_admin" && nomOrg) {
    const { erreur } = await creerOrganisationPour(user, nomOrg);
    if (!erreur) {
      ({ data: profile } = await supabase
        .from("profiles")
        .select("*, organisation:organisations(*)")
        .eq("id", user.id)
        .single());
    }
  }

  if (profile && !profile.organisation_id && profile.role !== "super_admin") {
    return <SansOrganisation prenom={profile.prenom} />;
  }

  return (
    <DashboardShell profile={profile}>
      {children}
    </DashboardShell>
  );
}
