// Mise en forme commune (FCFA, dates en français).

/** 25000 → « 25 000 FCFA » */
export function fcfa(montant: number | string | null | undefined): string {
  const n = Number(montant) || 0;
  return `${Math.round(n).toLocaleString("fr-FR").replace(/ | /g, " ")} FCFA`;
}

export function dateCourte(d: string | Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export function dateLongue(d: string | Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function heure(d: string | Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

/** « il y a 5 min », « il y a 3 j » */
export function ilYa(d: string | Date | null | undefined): string {
  if (!d) return "";
  const s = Math.max(0, (Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  if (s < 30 * 86400) return `il y a ${Math.floor(s / 86400)} j`;
  return dateCourte(d);
}

/** Une relation Supabase peut revenir en objet ou en tableau d'un élément. */
export function un<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

export function nomComplet(p: { prenom?: string | null; nom?: string | null } | null | undefined): string {
  return [p?.prenom, p?.nom].filter(Boolean).join(" ") || "—";
}
