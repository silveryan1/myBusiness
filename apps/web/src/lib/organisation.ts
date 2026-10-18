import { createServiceClient } from "@/lib/supabase/admin";

function slugDe(nom: string) {
  return nom.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "organisation";
}

/**
 * Crée l'organisation d'un utilisateur DÉJÀ IDENTIFIÉ par sa session et le rend administrateur,
 * seulement s'il n'appartient encore à aucune organisation. (Avant : la route publique
 * /api/setup-organisation acceptait n'importe quel userId, sans connexion.)
 * Appelée par l'action creerMonOrganisation et par la mise en page à la première connexion.
 */
export async function creerOrganisationPour(
  user: { id: string; email?: string | null },
  nomBrut: string
): Promise<{ erreur?: string }> {
  const nom = (nomBrut || "").trim().slice(0, 120);
  if (nom.length < 2) return { erreur: "Indiquez le nom de votre organisation." };

  const service = createServiceClient();
  const { data: profil } = await service.from("profiles").select("organisation_id").eq("id", user.id).single();
  if (!profil) return { erreur: "Profil introuvable." };
  if (profil.organisation_id) return { erreur: "Votre compte appartient déjà à une organisation." };

  let orgId: string | null = null;
  for (let essai = 0; essai < 3 && !orgId; essai++) {
    const slug = essai === 0 ? slugDe(nom) : `${slugDe(nom)}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await service.from("organisations")
      .insert({ nom, slug, status: "trial", pays: "Cameroun", email_contact: user.email ?? null })
      .select("id").single();
    if (data) orgId = data.id;
    else if (error && error.code !== "23505") return { erreur: "Impossible de créer l'organisation." };
  }
  if (!orgId) return { erreur: "Impossible de créer l'organisation." };

  const { error } = await service.from("profiles")
    .update({ organisation_id: orgId, role: "admin" })
    .eq("id", user.id).is("organisation_id", null);
  if (error) return { erreur: "Organisation créée, mais impossible de vous y rattacher." };
  return {};
}
