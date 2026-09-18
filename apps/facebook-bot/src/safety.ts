// ============================================================
// safety.ts — Protections anti-spam pour éviter la suspension
// Délais aléatoires, quotas, horaires de travail, rate limiting
// ============================================================

// ─── CONFIGURATION ────────────────────────────────────────────

const SAFETY_CONFIG = {
  // Horaires de travail (heure de Douala, UTC+1)
  workingHours: { start: 7, end: 23 },

  // Délais aléatoires avant de répondre (millisecondes)
  replyDelay: { min: 3 * 60 * 1000, max: 9 * 60 * 1000 }, // 3 à 9 minutes

  // Quotas journaliers
  dailyLimits: {
    commentReplies: 25,   // max 25 réponses aux commentaires/jour
    messages: 40,         // max 40 messages Messenger/jour
    posts: 3,             // max 3 publications/jour (en plus du planificateur)
  },

  // Rate limiting par heure
  hourlyLimits: {
    commentReplies: 8,
    messages: 15,
  },
};

// ─── COMPTEURS ────────────────────────────────────────────────

interface ActionCounts {
  commentReplies: number;
  messages: number;
  posts: number;
  lastReset: string; // date YYYY-MM-DD
  hourlyComments: number;
  hourlyMessages: number;
  lastHourReset: number; // timestamp
}

let counts: ActionCounts = {
  commentReplies: 0,
  messages: 0,
  posts: 0,
  lastReset: new Date().toISOString().split("T")[0],
  hourlyComments: 0,
  hourlyMessages: 0,
  lastHourReset: Date.now(),
};

// ─── HELPERS ──────────────────────────────────────────────────

/**
 * Remet à zéro les compteurs si on est dans un nouveau jour
 */
function resetIfNewDay(): void {
  const today = new Date().toISOString().split("T")[0];
  if (counts.lastReset !== today) {
    counts = {
      commentReplies: 0,
      messages: 0,
      posts: 0,
      lastReset: today,
      hourlyComments: 0,
      hourlyMessages: 0,
      lastHourReset: Date.now(),
    };
    console.log("🔄 Compteurs anti-spam réinitialisés pour la nouvelle journée");
  }

  // Reset horaire
  if (Date.now() - counts.lastHourReset > 60 * 60 * 1000) {
    counts.hourlyComments = 0;
    counts.hourlyMessages = 0;
    counts.lastHourReset = Date.now();
  }
}

/**
 * Vérifie si on est dans les heures de travail (heure de Douala)
 */
export function isWorkingHours(): boolean {
  const now = new Date();
  // Convertir en heure de Douala (UTC+1)
  const doualaHour = (now.getUTCHours() + 1) % 24;
  return (
    doualaHour >= SAFETY_CONFIG.workingHours.start &&
    doualaHour < SAFETY_CONFIG.workingHours.end
  );
}

/**
 * Génère un délai aléatoire humain avant de répondre
 */
export function getRandomDelay(): number {
  const { min, max } = SAFETY_CONFIG.replyDelay;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Attend un délai aléatoire (simule un humain qui lit et répond)
 */
export async function humanDelay(): Promise<void> {
  const delay = getRandomDelay();
  const minutes = Math.round(delay / 60000);
  console.log(`⏳ Délai humain: attente de ~${minutes} minutes avant de répondre...`);
  await new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Petit délai aléatoire entre deux actions consécutives (2-5 secondes)
 */
export async function microDelay(): Promise<void> {
  const delay = Math.floor(Math.random() * 3000) + 2000;
  await new Promise((resolve) => setTimeout(resolve, delay));
}

// ─── VÉRIFICATIONS DE QUOTA ───────────────────────────────────

/**
 * Vérifie si on peut encore répondre à un commentaire
 */
export function canReplyToComment(): boolean {
  resetIfNewDay();

  if (!isWorkingHours()) {
    console.log("🌙 Hors horaires de travail — pas de réponse aux commentaires");
    return false;
  }

  if (counts.commentReplies >= SAFETY_CONFIG.dailyLimits.commentReplies) {
    console.log(`⛔ Quota journalier atteint (${counts.commentReplies} réponses commentaires)`);
    return false;
  }

  if (counts.hourlyComments >= SAFETY_CONFIG.hourlyLimits.commentReplies) {
    console.log(`⛔ Quota horaire atteint (${counts.hourlyComments}/h commentaires)`);
    return false;
  }

  return true;
}

/**
 * Vérifie si on peut encore envoyer un message Messenger
 */
export function canSendMessage(): boolean {
  resetIfNewDay();

  if (counts.messages >= SAFETY_CONFIG.dailyLimits.messages) {
    console.log(`⛔ Quota journalier messages atteint (${counts.messages})`);
    return false;
  }

  if (counts.hourlyMessages >= SAFETY_CONFIG.hourlyLimits.messages) {
    console.log(`⛔ Quota horaire messages atteint (${counts.hourlyMessages}/h)`);
    return false;
  }

  return true;
}

/**
 * Vérifie si on peut encore publier un post
 */
export function canPublishPost(): boolean {
  resetIfNewDay();

  if (counts.posts >= SAFETY_CONFIG.dailyLimits.posts) {
    console.log(`⛔ Quota journalier publications atteint (${counts.posts})`);
    return false;
  }

  return true;
}

// ─── ENREGISTREMENT DES ACTIONS ──────────────────────────────

export function recordCommentReply(): void {
  counts.commentReplies++;
  counts.hourlyComments++;
  console.log(
    `📊 Compteur commentaires: ${counts.commentReplies}/${SAFETY_CONFIG.dailyLimits.commentReplies} aujourd'hui`
  );
}

export function recordMessageSent(): void {
  counts.messages++;
  counts.hourlyMessages++;
  console.log(
    `📊 Compteur messages: ${counts.messages}/${SAFETY_CONFIG.dailyLimits.messages} aujourd'hui`
  );
}

export function recordPostPublished(): void {
  counts.posts++;
}

/**
 * Retourne les statistiques actuelles
 */
export function getSafetyStats(): object {
  resetIfNewDay();
  return {
    date: counts.lastReset,
    workingHours: isWorkingHours(),
    commentReplies: `${counts.commentReplies}/${SAFETY_CONFIG.dailyLimits.commentReplies}`,
    messages: `${counts.messages}/${SAFETY_CONFIG.dailyLimits.messages}`,
    posts: `${counts.posts}/${SAFETY_CONFIG.dailyLimits.posts}`,
    hourlyComments: `${counts.hourlyComments}/${SAFETY_CONFIG.hourlyLimits.commentReplies}`,
    hourlyMessages: `${counts.hourlyMessages}/${SAFETY_CONFIG.hourlyLimits.messages}`,
  };
}
