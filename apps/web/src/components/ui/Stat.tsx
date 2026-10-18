/** Carte de chiffre clé. */
export default function Stat({ label, valeur, icone, sous, couleur = "from-indigo-500 to-purple-600" }: {
  label: string; valeur: string | number; icone: string; sous?: string; couleur?: string;
}) {
  return (
    <div className="stat-card">
      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${couleur} flex items-center justify-center text-lg mb-3`}>{icone}</div>
      <div className="text-2xl font-bold text-white break-words">{typeof valeur === "number" ? valeur.toLocaleString("fr-FR") : valeur}</div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
      {sous && <div className="text-xs text-slate-500 mt-1">{sous}</div>}
    </div>
  );
}
