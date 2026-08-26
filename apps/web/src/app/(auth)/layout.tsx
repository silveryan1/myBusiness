import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à votre espace myBusiness",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      <div className="mesh-bg" />

      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-10 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-cyan-500/05 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-white font-bold">mB</span>
            </div>
            <span className="font-bold text-xl gradient-text">myBusiness</span>
          </div>

          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            La plateforme pour gérer votre{" "}
            <span className="gradient-text">organisation</span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            Formations, membres, paiements, présences et certificats — tout en un seul endroit.
          </p>
        </div>

        {/* Feature list */}
        <div className="relative z-10 space-y-4">
          {[
            { icon: "✅", text: "Gestion multi-organisations" },
            { icon: "🎓", text: "Catalogue de formations illimité" },
            { icon: "📊", text: "Tableaux de bord en temps réel" },
            { icon: "📱", text: "Accessible sur Web & Mobile" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-3 text-slate-300">
              <span className="text-lg">{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">mB</span>
            </div>
            <span className="font-bold text-lg gradient-text">myBusiness</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
