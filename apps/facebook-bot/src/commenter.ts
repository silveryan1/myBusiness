// ============================================================
// commenter.ts — Réponse automatique aux commentaires (Gemini + Anti-spam)
// Scan toutes les 20 minutes, délais humains, quotas journaliers
// ============================================================

import cron from "node-cron";
import { facebookApi } from "./facebook-api";
import { generateCommentReply } from "./gemini";
import {
  canReplyToComment,
  humanDelay,
  microDelay,
  recordCommentReply,
  isWorkingHours,
} from "./safety";

// ─── TRACKING DES COMMENTAIRES TRAITÉS ───────────────────────

const processedCommentIds = new Set<string>();
const pendingReplies = new Map<string, NodeJS.Timeout>(); // commentaires en attente de réponse
let commentScanTask: cron.ScheduledTask | null = null;
let isRunning = false;

// ─── SCAN ET TRAITEMENT ───────────────────────────────────────

/**
 * Scanne les nouveaux commentaires et planifie des réponses avec délai humain
 */
async function scanAndReplyToComments(): Promise<void> {
  if (!isWorkingHours()) {
    console.log(`🌙 [${new Date().toLocaleString("fr-FR")}] Hors horaires — scan suspendu`);
    return;
  }

  try {
    console.log(`\n🔍 [${new Date().toLocaleString("fr-FR")}] Scan des nouveaux commentaires...`);

    const posts = await facebookApi.getRecentPosts(5);
    if (posts.length === 0) {
      console.log("  📭 Aucun post récent trouvé");
      return;
    }

    let newCount = 0;

    for (const post of posts) {
      const comments = await facebookApi.getPostComments(post.id);

      for (const comment of comments) {
        // Ignorer déjà traités
        if (processedCommentIds.has(comment.id)) continue;

        // Ignorer les commentaires de la page elle-même
        if (
          !comment.from ||
          comment.from.name?.toLowerCase().includes("silverdev")
        ) {
          processedCommentIds.add(comment.id);
          continue;
        }

        // Vérifier quota
        if (!canReplyToComment()) {
          console.log("  ⛔ Quota atteint — arrêt du scan");
          return;
        }

        // Marquer comme en cours de traitement
        processedCommentIds.add(comment.id);
        newCount++;

        const authorName = comment.from.name;
        const commentText = comment.message || "";
        const postMessage = post.message || "Publication SilverDev";

        console.log(`  💬 Nouveau commentaire de ${authorName}: "${commentText.substring(0, 50)}..."`);
        console.log(`  ⏳ Planification de la réponse avec délai humain...`);

        // Planifier la réponse avec un délai aléatoire (3-9 min) — simule un humain
        const delay = Math.floor(Math.random() * (9 - 3 + 1) + 3) * 60 * 1000;
        const commentId = comment.id;

        const timer = setTimeout(async () => {
          try {
            // Vérifier à nouveau le quota au moment de répondre
            if (!canReplyToComment()) return;

            // Liker d'abord le commentaire
            await facebookApi.likeComment(commentId);
            await microDelay();

            // Générer réponse avec Gemini
            const reply = await generateCommentReply(
              commentText,
              authorName,
              postMessage
            );

            // Publier la réponse
            await facebookApi.replyToComment(commentId, reply);
            recordCommentReply();

            console.log(`  ✅ Réponse envoyée à ${authorName} (après ${Math.round(delay / 60000)} min)`);
            pendingReplies.delete(commentId);
          } catch (err) {
            console.error(`  ❌ Erreur réponse différée à ${authorName}:`, err);
          }
        }, delay);

        pendingReplies.set(commentId, timer);

        // Petite pause entre les traitements
        await microDelay();
      }
    }

    if (newCount > 0) {
      console.log(`  📌 ${newCount} nouveau(x) commentaire(s) — réponses planifiées avec délai`);
    } else {
      console.log("  ✅ Aucun nouveau commentaire");
    }
  } catch (error) {
    console.error("❌ Erreur lors du scan des commentaires:", error);
  }
}

// ─── DÉMARRAGE / ARRÊT ───────────────────────────────────────

/**
 * Démarre le scanner de commentaires (toutes les 20 minutes)
 */
export function startCommentScanner(): void {
  if (isRunning) {
    console.log("⚠️  Le scanner de commentaires est déjà actif.");
    return;
  }

  // Scan toutes les 20 minutes (intervalle irrégulier pour paraître humain)
  commentScanTask = cron.schedule(
    "*/20 * * * *",
    scanAndReplyToComments,
    {
      timezone: "Africa/Douala",
      scheduled: true,
    }
  );

  isRunning = true;
  console.log("✅ Scanner de commentaires démarré (toutes les 20 min, délais humains 3-9 min)");

  // Premier scan après 2 minutes (pas immédiat)
  setTimeout(scanAndReplyToComments, 2 * 60 * 1000);
}

/**
 * Arrête le scanner et annule les réponses en attente
 */
export function stopCommentScanner(): void {
  if (commentScanTask) {
    commentScanTask.stop();
    commentScanTask = null;
  }

  // Annuler les réponses différées en attente
  pendingReplies.forEach((timer) => clearTimeout(timer));
  pendingReplies.clear();

  isRunning = false;
  console.log("⏹️  Scanner de commentaires arrêté.");
}

export { scanAndReplyToComments };
