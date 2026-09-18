// ============================================================
// messenger.ts — Bot Messenger intelligent (Gemini + Anti-spam)
// Répond aux messages privés avec contexte et mémoire de conversation
// ============================================================

import { facebookApi } from "./facebook-api";
import { generateMessageReply } from "./gemini";
import {
  canSendMessage,
  recordMessageSent,
  microDelay,
  isWorkingHours,
} from "./safety";

// ─── TYPES ───────────────────────────────────────────────────

export interface MessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    quick_reply?: { payload: string };
    attachments?: any[];
    is_echo?: boolean;
  };
  postback?: {
    title: string;
    payload: string;
  };
}

// ─── MÉMOIRE DE CONVERSATION ─────────────────────────────────

// Garde l'historique des 5 derniers messages par utilisateur
const conversationHistory = new Map<
  string,
  Array<{ role: "user" | "assistant"; text: string }>
>();

function addToHistory(
  userId: string,
  role: "user" | "assistant",
  text: string
): void {
  if (!conversationHistory.has(userId)) {
    conversationHistory.set(userId, []);
  }
  const history = conversationHistory.get(userId)!;
  history.push({ role, text });

  // Garder seulement les 8 derniers messages
  if (history.length > 8) history.shift();
}

// ─── MENUS ET RÉPONSES RAPIDES ────────────────────────────────

const QUICK_REPLIES_MAIN = [
  { title: "🌐 Site Web", payload: "SERVICE_WEBSITE" },
  { title: "🛒 Boutique en ligne", payload: "SERVICE_ECOMMERCE" },
  { title: "📱 Application", payload: "SERVICE_APP" },
  { title: "💰 Tarifs", payload: "SERVICE_PRICING" },
  { title: "📞 Parler à quelqu'un", payload: "CONTACT_HUMAN" },
];

const PAYLOAD_MESSAGES: Record<string, string> = {
  SERVICE_WEBSITE: `🌐 Sites Web Professionnels

Nous créons des sites modernes et performants :
✅ Sites vitrines & portfolios
✅ Sites institutionnels & landing pages
✅ Responsive (mobile, tablette, PC)
✅ Optimisé Google (SEO inclus)
✅ Livraison en 7-14 jours

💰 À partir de 150 000 FCFA

👉 Voir nos réalisations : https://silver-portfolio-silk.vercel.app/
📱 WhatsApp : +237 690 891 052`,

  SERVICE_ECOMMERCE: `🛒 Boutiques en Ligne

Vendez vos produits 24h/24 !
✅ Catalogue produits illimité
✅ Orange Money, MTN MoMo, Moov Money
✅ Gestion commandes & stocks
✅ Tableau de bord des ventes

💰 À partir de 300 000 FCFA

📱 WhatsApp : +237 690 891 052
🌐 https://silver-portfolio-silk.vercel.app/`,

  SERVICE_APP: `📱 Applications Mobiles & Web

Votre idée devient réalité :
✅ Android & iOS
✅ Apps de livraison, gestion, marketplace
✅ Backend & API robustes
✅ Paiement en plusieurs fois disponible

💰 À partir de 500 000 FCFA

📱 WhatsApp : +237 690 891 052
🌐 https://silver-portfolio-silk.vercel.app/`,

  SERVICE_PRICING: `💰 Nos Tarifs

🌐 Site vitrine ........... 150 000 – 300 000 FCFA
🛒 Boutique en ligne ....... 300 000 – 600 000 FCFA
📱 App mobile .............. dès 500 000 FCFA
🎨 Logo & design ........... 30 000 – 100 000 FCFA
🔧 Maintenance/mois ........ dès 15 000 FCFA

✅ Devis gratuit & sans engagement
💳 Paiement en 2 ou 3 fois possible

📱 WhatsApp : +237 690 891 052
🌐 https://silver-portfolio-silk.vercel.app/`,

  CONTACT_HUMAN: `👤 Contactez-nous directement !

📱 WhatsApp : +237 690 891 052
🌐 Site web : https://silver-portfolio-silk.vercel.app/
💬 Message Facebook : répondez ici

⏰ Disponibles :
• Lun – Ven : 8h – 18h
• Samedi : 9h – 14h (heure de Douala)

Laissez votre message et on vous répond rapidement ! 😊`,

  GET_STARTED: ``,
  MAIN_MENU: ``,
};

// ─── TRAITEMENT DES MESSAGES ──────────────────────────────────

/**
 * Traite un événement de message entrant
 */
export async function handleMessagingEvent(event: MessagingEvent): Promise<void> {
  const senderId = event.sender.id;

  // Ignorer les echos (messages de la page elle-même)
  if (event.message?.is_echo) return;

  try {
    // ── Postback (clic bouton menu) ──
    if (event.postback) {
      await handlePostback(senderId, event.postback.payload);
      return;
    }

    // ── Quick reply ──
    if (event.message?.quick_reply) {
      await handlePostback(senderId, event.message.quick_reply.payload);
      return;
    }

    // ── Message texte → Gemini ──
    if (event.message?.text) {
      await handleTextWithGemini(senderId, event.message.text);
      return;
    }

    // ── Pièce jointe ──
    if (event.message?.attachments) {
      if (!canSendMessage()) return;
      await microDelay();
      await facebookApi.sendMessage(
        senderId,
        "Merci pour le fichier ! 📎 Notre équipe va l'examiner. Pouvez-vous décrire brièvement votre projet en texte ? 😊"
      );
      recordMessageSent();
    }
  } catch (error) {
    console.error(`❌ Erreur traitement message de ${senderId}:`, error);
  }
}

/**
 * Gère un message texte via Gemini (avec mémoire de conversation)
 */
async function handleTextWithGemini(
  senderId: string,
  text: string
): Promise<void> {
  if (!canSendMessage()) {
    console.log(`⛔ Quota messages atteint — message de ${senderId} ignoré`);
    return;
  }

  console.log(`  💬 Message de ${senderId}: "${text.substring(0, 60)}"`);

  // Sauvegarder le message dans l'historique
  addToHistory(senderId, "user", text);

  // Petit délai humain (1-3 secondes pour simuler la lecture)
  const readDelay = Math.floor(Math.random() * 2000) + 1000;
  await new Promise((resolve) => setTimeout(resolve, readDelay));

  // Générer la réponse avec Gemini
  const history = conversationHistory.get(senderId) || [];
  const reply = await generateMessageReply(text, history.slice(0, -1));

  // Envoyer la réponse avec un menu de navigation
  await facebookApi.sendMessageWithQuickReplies(senderId, reply, QUICK_REPLIES_MAIN);

  // Enregistrer la réponse dans l'historique
  addToHistory(senderId, "assistant", reply);
  recordMessageSent();
}

/**
 * Gère un postback (clic bouton ou quick reply)
 */
async function handlePostback(senderId: string, payload: string): Promise<void> {
  console.log(`  📲 Postback de ${senderId}: ${payload}`);

  if (!canSendMessage()) return;

  if (payload === "GET_STARTED") {
    await sendWelcomeMessage(senderId);
    return;
  }

  if (payload === "MAIN_MENU") {
    await facebookApi.sendMessageWithQuickReplies(
      senderId,
      "Que puis-je faire pour vous ? 👇",
      QUICK_REPLIES_MAIN
    );
    recordMessageSent();
    return;
  }

  const message = PAYLOAD_MESSAGES[payload];
  if (message) {
    await facebookApi.sendMessageWithQuickReplies(
      senderId,
      message,
      [
        { title: "✅ Demander un devis", payload: "REQUEST_QUOTE" },
        { title: "🔙 Menu principal", payload: "MAIN_MENU" },
      ]
    );
    recordMessageSent();
  } else if (payload === "REQUEST_QUOTE") {
    await facebookApi.sendMessage(
      senderId,
      "Parfait ! 🎉 Décrivez votre projet ici (nom, type de site/app, budget approximatif) et notre équipe vous prépare un devis gratuit sous 2-4h. 📩"
    );
    recordMessageSent();
  } else {
    await sendWelcomeMessage(senderId);
  }
}

/**
 * Envoie le message de bienvenue
 */
async function sendWelcomeMessage(senderId: string): Promise<void> {
  const welcome = `👋 Bienvenue chez SilverDev !

Nous créons vos sites web, boutiques en ligne et applications mobiles au Cameroun. 🇨🇲

Comment puis-je vous aider aujourd'hui ?`;

  await facebookApi.sendMessageWithQuickReplies(senderId, welcome, QUICK_REPLIES_MAIN);
  recordMessageSent();
}

/**
 * Configure le profil Messenger (bouton Démarrer + menu persistant)
 */
export async function setupMessengerProfile(): Promise<void> {
  await facebookApi.setMessengerProfile({
    get_started: { payload: "GET_STARTED" },
    greeting: [
      {
        locale: "default",
        text: "👋 Bienvenue chez SilverDev ! Sites web, boutiques en ligne & applications mobiles. Cliquez sur Démarrer !",
      },
    ],
    persistent_menu: [
      {
        locale: "default",
        composer_input_disabled: false,
        call_to_actions: [
          { type: "postback", title: "🌐 Site Web", payload: "SERVICE_WEBSITE" },
          { type: "postback", title: "🛒 Boutique en ligne", payload: "SERVICE_ECOMMERCE" },
          { type: "postback", title: "📱 Application mobile", payload: "SERVICE_APP" },
          { type: "postback", title: "💰 Voir les tarifs", payload: "SERVICE_PRICING" },
          { type: "postback", title: "📞 Contacter l'équipe", payload: "CONTACT_HUMAN" },
        ],
      },
    ],
  });

  console.log("✅ Profil Messenger configuré (menu + greeting + get_started)");
}

export { sendWelcomeMessage };
