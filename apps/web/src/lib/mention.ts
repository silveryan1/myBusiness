// Mention d'après une note (mêmes seuils partout : notes, certificats).
export function mention(note: number, max: number) {
  const pct = (note / max) * 100;
  if (pct >= 90) return { label: "Très bien", couleur: "text-emerald-400" };
  if (pct >= 75) return { label: "Bien", couleur: "text-blue-400" };
  if (pct >= 60) return { label: "Assez bien", couleur: "text-cyan-400" };
  if (pct >= 50) return { label: "Passable", couleur: "text-amber-400" };
  return { label: "Insuffisant", couleur: "text-red-400" };
}
