import Link from "next/link";

/** Titre de page, sous-titre, lien retour et bouton d'action à droite. */
export default function EnTete({ titre, sousTitre, retour, children }: {
  titre: string;
  sousTitre?: string;
  retour?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {retour && (
          <Link href={retour} className="btn btn-ghost btn-sm flex-shrink-0" aria-label="Retour">←</Link>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-white truncate">{titre}</h1>
          {sousTitre && <p className="text-slate-400 mt-1 text-sm">{sousTitre}</p>}
        </div>
      </div>
      {children && <div className="flex flex-wrap gap-2 flex-shrink-0">{children}</div>}
    </div>
  );
}
