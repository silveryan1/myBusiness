// ============================================================
// content/posts.ts — Bibliothèque de contenu pour SilverDev
// 30+ templates de posts promouvant les services de développement
// ============================================================

export interface PostTemplate {
  id: string;
  category: string;
  message: string;
  hashtags: string[];
  imageKeyword?: string; // mot-clé pour trouver une image représentative
}

// ─── TEMPLATES DE POSTS PAR CATÉGORIE ────────────────────────

const postTemplates: PostTemplate[] = [
  // ── CRÉATION DE SITES WEB ──
  {
    id: "web-001",
    category: "site-web",
    message: `🌐 Vous rêvez d'un site web professionnel pour votre entreprise ?

Chez SilverDev, nous créons des sites web modernes, rapides et sur mesure qui reflètent vraiment l'image de votre marque.

✅ Design moderne et responsive
✅ Optimisé pour Google (SEO)
✅ Livraison en 7-14 jours
✅ Modifications gratuites

📩 Contactez-nous maintenant pour un devis GRATUIT !`,
    hashtags: ["#SiteWeb", "#DéveloppementWeb", "#SilverDev", "#WebDesign", "#Cameroun"],
    imageKeyword: "website",
  },
  {
    id: "web-002",
    category: "site-web",
    message: `💡 Saviez-vous qu'un site web professionnel peut multiplier vos clients par 3 ?

En 2024, 87% des consommateurs recherchent une entreprise en ligne avant d'acheter. Si vous n'êtes pas visible sur internet, vos clients vont chez la concurrence.

🚀 SilverDev vous aide à conquérir le web !

🎯 Sites vitrine
🛒 Boutiques en ligne  
📱 Applications web

Demandez votre devis gratuit en message privé !`,
    hashtags: ["#DigitalMarketing", "#SiteWeb", "#SilverDev", "#Business", "#Entrepreneur"],
    imageKeyword: "digital marketing",
  },
  {
    id: "web-003",
    category: "site-web",
    message: `🔥 OFFRE SPÉCIALE — Site Web Vitrine à partir de 150 000 FCFA !

Vous avez une entreprise mais pas encore de présence en ligne ? Il est temps de changer ça !

SilverDev vous propose :
🌐 Site web vitrine professionnel
📱 Compatible mobile et tablette
⚡ Chargement ultra-rapide
🔒 Certificat SSL inclus (HTTPS)
📊 1 an d'hébergement offert

👉 Envoyez-nous un message ou appelez maintenant !`,
    hashtags: ["#SiteWeb", "#OffreSpéciale", "#SilverDev", "#PME", "#Entrepreneur"],
    imageKeyword: "web development offer",
  },

  // ── E-COMMERCE ──
  {
    id: "ecom-001",
    category: "e-commerce",
    message: `🛒 Vendez en ligne 24h/24, 7j/7 — même quand vous dormez !

Avec une boutique en ligne créée par SilverDev, vos produits sont disponibles pour tous vos clients, partout et à tout moment.

Notre solution e-commerce comprend :
🏪 Catalogue de produits illimité
💳 Paiements sécurisés (Mobile Money, Carte bancaire)
📦 Gestion des commandes et stocks
📈 Tableau de bord des ventes
🚚 Intégration livraison

Lancez votre boutique en ligne maintenant ! 💬`,
    hashtags: ["#Ecommerce", "#BoutiqueEnLigne", "#SilverDev", "#VenteEnLigne", "#MobileMoney"],
    imageKeyword: "online store",
  },
  {
    id: "ecom-002",
    category: "e-commerce",
    message: `📱 Mobile Money + Boutique en ligne = Succès garanti ! 💰

Vos clients paient avec Orange Money, MTN MoMo ou Moov Money directement sur votre site. Plus besoin de déplacements ou d'échanges compliqués !

SilverDev intègre tous les moyens de paiement mobiles africains dans votre boutique.

🎯 Commencez à vendre en ligne dès aujourd'hui !
💬 Message privé pour votre devis gratuit`,
    hashtags: ["#MobileMoney", "#OrangeMoney", "#MTNMoMo", "#Ecommerce", "#SilverDev"],
    imageKeyword: "mobile payment africa",
  },

  // ── DÉVELOPPEMENT D'APPLICATIONS ──
  {
    id: "app-001",
    category: "application",
    message: `📱 Votre idée mérite une application mobile !

Que vous ayez un projet de startup, une application de livraison, un réseau social local ou un outil de gestion — SilverDev transforme vos idées en réalité.

Notre expertise :
📱 Applications Android & iOS
💻 Applications Web progressives (PWA)
🔄 API et backends robustes
☁️ Hébergement et maintenance

🚀 Parlons de votre projet ! Contactez-nous en message privé.`,
    hashtags: ["#AppMobile", "#DéveloppementApp", "#SilverDev", "#Startup", "#Innovation"],
    imageKeyword: "mobile app development",
  },
  {
    id: "app-002",
    category: "application",
    message: `🔧 Vous avez un problème métier ? Nous avons l'application !

Gestion des employés, suivi des ventes, logistique, réservations en ligne... SilverDev développe des outils sur mesure pour automatiser et simplifier votre activité.

✅ Analyse de vos besoins gratuite
✅ Développement sur mesure
✅ Formation de votre équipe
✅ Support après livraison

📩 Décrivez votre projet, on vous rappelle !`,
    hashtags: ["#Logiciel", "#GestionEntreprise", "#SilverDev", "#Automatisation", "#Tech"],
    imageKeyword: "business software",
  },

  // ── DESIGN & UI ──
  {
    id: "design-001",
    category: "design",
    message: `🎨 Un bon design, c'est la première impression que vous donnez à vos clients !

Chez SilverDev, nos designers créent des interfaces belles et intuitives qui convertissent les visiteurs en clients.

🖌️ Logos et identité visuelle
📐 Design de sites web (UI/UX)
📱 Maquettes d'applications
🖼️ Visuels pour réseaux sociaux

La beauté, c'est notre métier. La performance, c'est notre résultat.

💬 Contactez-nous pour votre projet design !`,
    hashtags: ["#Design", "#UIDesign", "#UXDesign", "#Logo", "#SilverDev"],
    imageKeyword: "ui ux design",
  },

  // ── SEO & MARKETING DIGITAL ──
  {
    id: "seo-001",
    category: "seo",
    message: `🔍 Votre site web est invisible sur Google ? On peut changer ça !

Le référencement naturel (SEO) est la clé pour attirer des clients qui cherchent exactement ce que vous proposez — sans payer de publicité !

SilverDev vous offre :
📊 Audit SEO gratuit de votre site
🔑 Optimisation des mots-clés
📝 Création de contenu optimisé
📈 Suivi mensuel de votre position Google

👉 Demandez votre audit SEO gratuit aujourd'hui !`,
    hashtags: ["#SEO", "#RéférenecementGoogle", "#MarketingDigital", "#SilverDev", "#Google"],
    imageKeyword: "seo google ranking",
  },

  // ── MAINTENANCE & SUPPORT ──
  {
    id: "support-001",
    category: "maintenance",
    message: `🛡️ Votre site web est votre vitrine — protégez-le !

Un site web non maintenu, c'est une porte ouverte aux hackers et aux pannes. SilverDev assure la maintenance complète de votre présence en ligne.

🔐 Mises à jour de sécurité
⚡ Optimisation des performances
💾 Sauvegardes automatiques quotidiennes
📊 Rapports mensuels
🆘 Support d'urgence 24/7

📩 Forfaits maintenance à partir de 15 000 FCFA/mois`,
    hashtags: ["#Maintenance", "#SécuritéWeb", "#SilverDev", "#Support", "#Hébergement"],
    imageKeyword: "website maintenance security",
  },
  {
    id: "support-002",
    category: "maintenance",
    message: `💪 SilverDev — Votre partenaire tech de confiance !

Nous ne créons pas juste des sites web. Nous construisons des partenariats durables avec nos clients.

Après la livraison de votre projet :
✅ 3 mois de support gratuit inclus
✅ Formations à l'utilisation
✅ Guide d'administration
✅ Réponse en moins de 24h

Parce que votre succès en ligne, c'est notre fierté. 🏆`,
    hashtags: ["#SilverDev", "#Support", "#ServiceClient", "#Partenariat", "#Web"],
    imageKeyword: "customer support tech",
  },

  // ── TÉMOIGNAGES / SOCIAL PROOF ──
  {
    id: "social-001",
    category: "temoignage",
    message: `⭐⭐⭐⭐⭐ "Excellent travail ! Mon site a été livré en 10 jours, exactement comme je le voulais. Les clients me trouvent maintenant sur Google. Merci SilverDev !"

👤 — Client satisfait, Commerce de Douala

Vous aussi, rejoignez nos clients satisfaits ! 
💬 Contactez-nous pour votre projet.`,
    hashtags: ["#Témoignage", "#ClientSatisfait", "#SilverDev", "#Avis", "#SiteWeb"],
    imageKeyword: "happy customer review",
  },
  {
    id: "social-002",
    category: "temoignage",
    message: `🏆 Fiers de nos réalisations !

En 2024, SilverDev a livré :
✅ +30 sites web professionnels
✅ +8 applications mobiles
✅ +15 boutiques en ligne
✅ 100% de clients satisfaits

Notre mission : transformer votre vision numérique en succès concret.

🚀 Prêt à rejoindre nos success stories ? Contactez-nous !`,
    hashtags: ["#SilverDev", "#Réalisations", "#Portfolio", "#DéveloppementWeb", "#Succès"],
    imageKeyword: "team success achievement",
  },

  // ── CONSEILS & VALEUR AJOUTÉE ──
  {
    id: "tips-001",
    category: "conseil",
    message: `💡 5 SIGNES que votre entreprise a besoin d'un site web maintenant :

1️⃣ Vos clients vous demandent votre site web
2️⃣ Vos concurrents sont déjà en ligne
3️⃣ Vous perdez des ventes le weekend et la nuit
4️⃣ Vos clients ne savent pas exactement ce que vous proposez
5️⃣ Vous n'êtes pas trouvable sur Google

Si vous reconnaissez votre situation, il est URGENT d'agir !

💬 SilverDev vous aide à passer au digital. Message privé pour votre devis gratuit.`,
    hashtags: ["#ConseilDigital", "#SiteWeb", "#Business", "#SilverDev", "#Entrepreneur"],
    imageKeyword: "business tips digital",
  },
  {
    id: "tips-002",
    category: "conseil",
    message: `🤔 Site web vs Page Facebook — Quelle différence ?

📘 Page Facebook :
• Gratuite mais limitée
• Vous ne contrôlez pas les règles
• Peut être supprimée à tout moment
• Peu crédible pour les grandes commandes

🌐 Site Web Professionnel :
• Vous appartenez sur Google
• Personnalisable à 100%
• Crédibilité maximale
• Disponible 24h/24 pour vos clients

La combinaison PARFAITE ? Les deux ensemble ! 🏆

SilverDev vous aide à créer les deux. 💬`,
    hashtags: ["#SiteWeb", "#Facebook", "#ConseilDigital", "#SilverDev", "#Marketing"],
    imageKeyword: "website vs social media",
  },
  {
    id: "tips-003",
    category: "conseil",
    message: `🚀 Comment doubler vos ventes avec le digital en 2024 ?

1. Créez un site web professionnel 🌐
2. Référencez-vous sur Google Maps 📍
3. Soyez actif sur les réseaux sociaux 📱
4. Créez du contenu utile pour vos clients 📝
5. Collectez les avis clients ⭐

Et si vous ne savez pas par où commencer...

SilverDev est là ! On s'occupe de tout votre digital. 💪
📩 Message privé pour un accompagnement personnalisé.`,
    hashtags: ["#ConseilBusiness", "#DoubleVentes", "#SilverDev", "#StratégieDigitale", "#Marketing"],
    imageKeyword: "business growth digital strategy",
  },

  // ── PROMOTION / URGENCE ──
  {
    id: "promo-001",
    category: "promotion",
    message: `⏰ ATTENTION — Offre limitée cette semaine !

Les 3 premiers clients à réserver cette semaine bénéficient de :
🎁 Nom de domaine GRATUIT (valeur : 15 000 FCFA)
🎁 1 an d'hébergement GRATUIT (valeur : 30 000 FCFA)
🎁 Intégration réseaux sociaux GRATUITE

Cette offre expire dans 48h ⏳

Envoyez-nous un message MAINTENANT pour en profiter !
🔴 Places limitées — Premier arrivé, premier servi.`,
    hashtags: ["#OffreSpéciale", "#LimitedOffer", "#SilverDev", "#SiteWeb", "#Promo"],
    imageKeyword: "special offer limited time",
  },
  {
    id: "promo-002",
    category: "promotion",
    message: `🎯 Vous cherchez un développeur web fiable à un prix juste ?

Chez SilverDev, nous croyons que chaque entreprise mérite une présence en ligne de qualité, quelle que soit sa taille.

Nos tarifs transparents :
🌐 Site Vitrine : à partir de 150 000 FCFA
🛒 Boutique en ligne : à partir de 300 000 FCFA
📱 Application mobile : à partir de 500 000 FCFA
📊 Maintenance mensuelle : 15 000 FCFA/mois

Paiement en plusieurs fois possible ! 💳

📩 Contactez-nous pour un devis personnalisé.`,
    hashtags: ["#Tarifs", "#SilverDev", "#PrixAbordable", "#SiteWeb", "#Devis"],
    imageKeyword: "affordable web development pricing",
  },

  // ── MOTIVATION / ENGAGEMENT ──
  {
    id: "engage-001",
    category: "engagement",
    message: `📊 SONDAGE : Quelle est votre plus grande difficulté en ligne ?

A) 🔍 Pas trouvable sur Google
B) 📱 Pas de site web professionnel  
C) 💰 Pas de ventes en ligne
D) 🤷 Je ne sais pas par où commencer

Commentez avec votre lettre ! On vous aidera directement. 👇

SilverDev — Votre partenaire digital 🚀`,
    hashtags: ["#Sondage", "#SilverDev", "#Digital", "#Business", "#Entrepreneur"],
    imageKeyword: "poll survey business",
  },
  {
    id: "engage-002",
    category: "engagement",
    message: `🌍 Saviez-vous que l'Afrique est le continent avec la croissance internet la plus rapide ?

Le digital n'est plus une option — c'est une nécessité pour tout entrepreneur africain ambitieux.

💬 Question du jour : Est-ce que votre entreprise est déjà en ligne ?
→ OUI ✅
→ NON ❌ (on peut vous aider !)

SilverDev — Nous digitalisons l'Afrique, une entreprise à la fois. 🌐`,
    hashtags: ["#AfriqueDigitale", "#TechAfrica", "#SilverDev", "#Entrepreneur", "#Innovation"],
    imageKeyword: "africa digital technology",
  },
  {
    id: "engage-003",
    category: "engagement",
    message: `💬 Partagez dans les commentaires : Dans quel secteur est votre entreprise ? 👇

🛒 Commerce
🍽️ Restauration / Traiteur
🏥 Santé / Beauté
🏗️ Construction / Immobilier
📚 Éducation / Formation
🚗 Transport / Logistique
💼 Consulting / Services
🎨 Art / Créatif
Autre ?

SilverDev crée des solutions numériques pour TOUS les secteurs.
Dites-nous le vôtre et on vous propose la meilleure solution ! 🚀`,
    hashtags: ["#Secteurs", "#Business", "#SilverDev", "#Entrepreneur", "#Digital"],
    imageKeyword: "business sectors diversity",
  },
];

// ─── GESTIONNAIRE DE ROTATION ─────────────────────────────────

const USED_POSTS_KEY = "usedPostIds";
let usedPostIds: Set<string> = new Set();

/**
 * Sélectionne un post qui n'a pas encore été utilisé récemment
 * Réinitialise le cycle quand tous les posts ont été utilisés
 */
export function getNextPost(category?: string): PostTemplate {
  let pool = category
    ? postTemplates.filter((p) => p.category === category)
    : postTemplates;

  // Filtrer les posts non utilisés
  let available = pool.filter((p) => !usedPostIds.has(p.id));

  // Si tous utilisés, réinitialiser
  if (available.length === 0) {
    console.log("🔄 Tous les posts ont été utilisés — réinitialisation du cycle");
    usedPostIds.clear();
    available = pool;
  }

  // Sélection aléatoire
  const selected = available[Math.floor(Math.random() * available.length)];
  usedPostIds.add(selected.id);

  return selected;
}

// ─── COORDONNÉES DE CONTACT ──────────────────────────────────

const CONTACT_INFO = `\n📱 WhatsApp / Appel : +237 690 891 052
🌐 Portfolio : https://silver-portfolio-silk.vercel.app/`;

/**
 * Formate un post template en message final avec hashtags + coordonnées
 */
export function formatPost(template: PostTemplate): string {
  const hashtagsStr = template.hashtags.join(" ");
  return `${template.message}${CONTACT_INFO}\n\n${hashtagsStr}`;
}

/**
 * Retourne tous les posts d'une catégorie donnée
 */
export function getPostsByCategory(category: string): PostTemplate[] {
  return postTemplates.filter((p) => p.category === category);
}

export const POST_CATEGORIES = [
  "site-web",
  "e-commerce",
  "application",
  "design",
  "seo",
  "maintenance",
  "temoignage",
  "conseil",
  "promotion",
  "engagement",
] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number];

export default postTemplates;
