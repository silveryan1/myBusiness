import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <div className="mesh-bg" />
      <div className="min-h-screen flex flex-col">
        {/* Nav */}
        <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">mB</span>
            </div>
            <span className="font-bold text-lg gradient-text">myBusiness</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn btn-ghost">
              Se connecter
            </Link>
            <Link href="/register" className="btn btn-primary">
              Créer un compte
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24">
          <div className="animate-fade-in max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8 text-sm text-indigo-400 border border-indigo-500/20">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              Plateforme SaaS Multi-Organisation
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Gérez votre{" "}
              <span className="gradient-text">centre de formation</span>{" "}
              facilement
            </h1>

            <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              myBusiness est la plateforme tout-en-un pour gérer vos membres,
              formations, paiements, présences et certificats — depuis n&apos;importe où.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
              <Link href="/register" className="btn btn-primary btn-lg animate-pulse-glow">
                Démarrer gratuitement
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link href="/login" className="btn btn-secondary btn-lg">
                Voir une démo
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full px-4">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="glass-card p-6 text-left animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-2xl mb-4 border border-indigo-500/20">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-12">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold gradient-text">{s.value}</div>
                <div className="text-sm text-slate-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/5 py-6 px-8 text-center text-sm text-slate-600">
          © 2026 myBusiness — Tous droits réservés
        </footer>
      </div>
    </>
  );
}

const features = [
  {
    icon: "🎓",
    title: "Gestion des Formations",
    desc: "Créez un catalogue de formations, planifiez des sessions et gérez les inscriptions en quelques clics.",
  },
  {
    icon: "👥",
    title: "Multi-Rôles",
    desc: "Super Admin, Admin, Formateur et Étudiant — chaque utilisateur voit exactement ce dont il a besoin.",
  },
  {
    icon: "📊",
    title: "Rapports & Statistiques",
    desc: "Suivez les présences, notes, taux de réussite et revenus avec des tableaux de bord en temps réel.",
  },
  {
    icon: "💳",
    title: "Paiements Intégrés",
    desc: "Gérez les paiements avec Stripe — gratuit ou payant, c'est vous qui choisissez par formation.",
  },
  {
    icon: "📱",
    title: "Application Mobile",
    desc: "Accédez à tout depuis l'application iOS et Android — planning, cours, messagerie, certificats.",
  },
  {
    icon: "🏅",
    title: "Certificats PDF",
    desc: "Générez et envoyez automatiquement des attestations de formation au format PDF.",
  },
];

const stats = [
  { value: "∞", label: "Organisations" },
  { value: "4", label: "Types de rôles" },
  { value: "100%", label: "Multi-tenant" },
  { value: "Web + Mobile", label: "Disponible sur" },
];
