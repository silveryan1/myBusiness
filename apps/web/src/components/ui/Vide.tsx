/** Bloc « rien à afficher » avec une explication utile. */
export default function Vide({ icone, titre, texte, children }: {
  icone: string; titre: string; texte?: string; children?: React.ReactNode;
}) {
  return (
    <div className="glass-card py-14 px-6 text-center">
      <div className="text-4xl mb-3">{icone}</div>
      <h2 className="text-lg font-semibold text-white mb-1">{titre}</h2>
      {texte && <p className="text-slate-400 text-sm max-w-md mx-auto">{texte}</p>}
      {children && <div className="mt-6 flex flex-wrap gap-3 justify-center">{children}</div>}
    </div>
  );
}
