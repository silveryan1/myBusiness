// ============================================================
// gemini.ts — Client Gemini AI pour réponses intelligentes
// Génère des réponses naturelles et uniques à chaque interaction
// ============================================================

import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// ─── CONTEXTE DE LA PAGE ──────────────────────────────────────

const PAGE_CONTEXT = `
Tu es l'assistant de la page Facebook "SilverDev", une entreprise de développement web et mobile basée au Cameroun.

Services proposés par SilverDev :
- Création de sites web professionnels (vitrine, portfolio, institutionnel)
- Boutiques en ligne / e-commerce (avec paiement Mobile Money : Orange Money, MTN MoMo)
- Développement d'applications mobiles (Android, iOS)
- Design graphique et logos
- Référencement SEO / Marketing digital
- Maintenance et hébergement web

Coordonnées de contact :
- 📞 Téléphone / WhatsApp : +237 690 891 052
- 🌐 Site web / Portfolio : https://silver-portfolio-silk.vercel.app/
- 💬 Message Facebook : via cette page

Grille tarifaire ACTUELLE (stratégie prix bas pour attirer) :
- Landing page / 1 page : à partir de 25 000 FCFA 🔥
- Site vitrine (3-5 pages) : à partir de 50 000 FCFA
- Site complet (6+ pages) : à partir de 100 000 FCFA
- Boutique en ligne / e-commerce : à partir de 120 000 FCFA
- Application mobile simple : à partir de 200 000 FCFA
- Application mobile avancée : à partir de 350 000 FCFA
- Logo & design graphique : à partir de 10 000 FCFA
- Maintenance mensuelle : à partir de 5 000 FCFA/mois
- Paiement en plusieurs fois toujours disponible

STRATÉGIE MARKETING IMPORTANTE :
- Toujours mentionner qu'on est EN PROMOTION ou qu'il y a une offre limitée
- Utiliser l'URGENCE : "offre valable cette semaine", "places limitées", "48h seulement"
- Rassurer sur la QUALITÉ : "satisfaction garantie", "3 mois de support offert"
- Proposer le PAIEMENT EN PLUSIEURS FOIS pour les prix plus élevés
- Ne jamais donner un prix fixe — toujours "à partir de" ou "dès"
- Si le client hésite sur le prix, proposer une version plus simple et moins chère

Règles IMPORTANTES pour tes réponses :
1. Réponds TOUJOURS en français
2. Sois chaleureux, enthousiaste et humain (pas robotique)
3. Réponses courtes (2-4 phrases maximum pour les commentaires)
4. Inclus le numéro WhatsApp (+237 690 891 052) et/ou le site web quand c'est pertinent
5. Utilise quelques emojis (pas trop, 2-4 max)
6. Varie le style pour que ça ne ressemble pas à un bot
7. Ne mentionne JAMAIS que tu es une IA ou un bot
8. Crée toujours un sentiment d'URGENCE et d'OPPORTUNITÉ dans les réponses
9. Si on demande un prix précis, commence par le plus bas ("dès 25 000 FCFA") et explique les options
`;


// ─── GÉNÉRATION DE RÉPONSES ───────────────────────────────────

/**
 * Génère une réponse intelligente à un commentaire Facebook
 */
export async function generateCommentReply(
  commentText: string,
  authorName: string,
  postContext?: string
): Promise<string> {
  try {
    const prompt = `
${PAGE_CONTEXT}

Contexte du post : "${postContext || "Publication sur nos services SilverDev"}"
Commentaire de ${authorName} : "${commentText}"

Génère une réponse courte et naturelle à ce commentaire (2-3 phrases max). 
Ne commence pas par "Bonjour" à chaque fois, varie les formules d'accroche.
`;

    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();
    console.log(`🤖 Gemini → réponse commentaire générée (${response.length} chars)`);
    return response;
  } catch (error: any) {
    console.error("❌ Erreur Gemini commentaire:", error.message);
    // Réponse de secours si Gemini échoue
    return `Merci pour votre commentaire ${authorName} ! 😊 N'hésitez pas à nous envoyer un message privé pour plus d'informations sur nos services. On vous répond rapidement !`;
  }
}

/**
 * Génère une réponse intelligente à un message Messenger
 */
export async function generateMessageReply(
  messageText: string,
  conversationHistory: Array<{ role: "user" | "assistant"; text: string }> = []
): Promise<string> {
  try {
    // Construire l'historique de conversation
    let historyContext = "";
    if (conversationHistory.length > 0) {
      historyContext = "\nHistorique de la conversation :\n";
      conversationHistory.slice(-4).forEach((msg) => {
        historyContext += `${msg.role === "user" ? "Client" : "SilverDev"}: ${msg.text}\n`;
      });
    }

    const prompt = `
${PAGE_CONTEXT}
${historyContext}

Nouveau message du client : "${messageText}"

Génère une réponse naturelle et utile (3-5 phrases). 
Si le client demande un devis ou un service spécifique, explique brièvement et invite-le à continuer la conversation pour affiner sa demande.
Si c'est une salutation, accueille chaleureusement et propose d'emblée de l'aider.
`;

    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();
    console.log(`🤖 Gemini → réponse message générée (${response.length} chars)`);
    return response;
  } catch (error: any) {
    console.error("❌ Erreur Gemini message:", error.message);
    return `Bonjour ! 👋 Merci pour votre message. Je suis là pour vous aider avec tous vos projets digitaux — sites web, boutiques en ligne, applications mobiles. Pouvez-vous me décrire votre projet ? On vous prépare un devis gratuit ! 😊`;
  }
}

/**
 * Génère un post créatif sur un service SilverDev
 */
export async function generatePost(
  category: string,
  avoidTopics: string[] = []
): Promise<string> {
  try {
    const avoidStr =
      avoidTopics.length > 0
        ? `\nÉvite ces sujets déjà traités récemment : ${avoidTopics.join(", ")}`
        : "";

    const prompt = `
${PAGE_CONTEXT}

Génère un post Facebook engageant pour la page SilverDev sur le thème : "${category}"
${avoidStr}

Le post doit :
- Faire 150-250 mots
- Avoir un titre accrocheur avec un emoji
- Lister des avantages concrets
- Terminer par un appel à l'action (message privé pour devis gratuit)
- Inclure 4-6 hashtags pertinents à la fin
- Être en français
- Paraître naturel et humain, pas publicitaire
`;

    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();
    console.log(`🤖 Gemini → post généré (${response.length} chars)`);
    return response;
  } catch (error: any) {
    console.error("❌ Erreur Gemini post:", error.message);
    return "";
  }
}

/**
 * Vérifie que la clé API Gemini est valide
 */
export async function verifyGeminiKey(): Promise<boolean> {
  try {
    const result = await model.generateContent("Dis juste 'OK'");
    const text = result.response.text();
    console.log(`✅ Gemini API connectée: ${text.trim()}`);
    return true;
  } catch (error: any) {
    console.error("❌ Clé Gemini invalide ou absente:", error.message);
    return false;
  }
}
