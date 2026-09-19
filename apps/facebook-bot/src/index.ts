// ============================================================
// index.ts — Serveur principal du bot Facebook SilverDev
// Express server + Webhooks Facebook + Planificateur
// ============================================================

import express, { Request, Response } from "express";
import * as dotenv from "dotenv";
import { facebookApi } from "./facebook-api";
import { startScheduler } from "./scheduler";
import { startCommentScanner } from "./commenter";
import { handleMessagingEvent, setupMessengerProfile } from "./messenger";
import { verifyGeminiKey } from "./gemini";
import { getSafetyStats } from "./safety";
import { sendStartupEmail, sendCriticalAlert, sendWeeklyReport } from "./mailer";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN || "silverdev_webhook_token";

// ─── MIDDLEWARE ───────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── ROUTES DE SANTÉ ─────────────────────────────────────────

app.get("/", (_req: Request, res: Response) => {
  res.json({
    status: "✅ SilverDev Facebook Bot en ligne",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    page: "SilverDev (ID: 1365838339939707)",
    app: "DigitalMaster (ID: 1654503223012170)",
  });
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  });
});

// ─── WEBHOOKS FACEBOOK ────────────────────────────────────────

/**
 * Vérification du webhook (requis par Facebook lors de la configuration)
 * GET /webhook?hub.mode=subscribe&hub.challenge=xxx&hub.verify_token=yyy
 */
app.get("/webhook", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log(`🔐 Vérification webhook: mode=${mode}, token_match=${token === VERIFY_TOKEN}`);

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook vérifié avec succès !");
    res.status(200).send(challenge);
  } else {
    console.error("❌ Vérification webhook échouée — token incorrect");
    res.status(403).send("Forbidden");
  }
});

/**
 * Réception des événements Facebook (messages, commentaires)
 * POST /webhook
 */
app.post("/webhook", async (req: Request, res: Response) => {
  const body = req.body;

  // Toujours répondre 200 immédiatement à Facebook
  res.status(200).send("EVENT_RECEIVED");

  if (body.object !== "page") return;

  // Traiter chaque entrée
  for (const entry of body.entry || []) {
    // ── Messages Messenger ──
    if (entry.messaging) {
      for (const event of entry.messaging) {
        // Ignorer les echos (messages envoyés par la page elle-même)
        if (event.message?.is_echo) continue;

        console.log(`\n📨 Événement Messenger reçu de: ${event.sender?.id}`);
        await handleMessagingEvent(event);
      }
    }

    // ── Changements de feed (commentaires, likes) ──
    if (entry.changes) {
      for (const change of entry.changes) {
        console.log(`\n📋 Changement feed: ${change.field}`);
        
        if (change.field === "feed" && change.value?.item === "comment") {
          const commentData = change.value;
          
          // Ignorer les commentaires de la page elle-même
          if (commentData.sender_id === process.env.FACEBOOK_PAGE_ID) continue;
          
          console.log(`  💬 Nouveau commentaire: "${commentData.message?.substring(0, 60)}"`);
          // Les commentaires via webhook sont traités par le scanner toutes les 15 min
          // Mais si on reçoit un webhook, on peut traiter immédiatement
        }
      }
    }
  }
});

// ─── API D'ADMINISTRATION ─────────────────────────────────────

/**
 * Publier un post immédiatement (depuis l'interface admin)
 */
app.post("/admin/publish", async (req: Request, res: Response) => {
  const { message, category, adminToken } = req.body;

  // Vérification token admin
  if (adminToken !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: "Non autorisé" });
  }

  try {
    if (message) {
      // Post personnalisé
      const result = await facebookApi.publishPost(message);
      return res.json({ success: true, postId: result.id, message: "Post publié" });
    } else {
      // Post automatique depuis la bibliothèque
      const { publishNow } = await import("./scheduler");
      await publishNow(category);
      return res.json({ success: true, message: "Post automatique publié" });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Statut du bot
 */
app.get("/admin/status", (req: Request, res: Response) => {
  const { adminToken } = req.query;
  if (adminToken !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: "Non autorisé" });
  }
  return res.json({ status: "running", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

/**
 * Statistiques anti-spam
 */
app.get("/admin/safety", (req: Request, res: Response) => {
  const { adminToken } = req.query;
  if (adminToken !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: "Non autorisé" });
  }
  return res.json(getSafetyStats());
});

// ─── INITIALISATION ───────────────────────────────────────────

async function bootstrap(): Promise<void> {
  console.log("\n╔═══════════════════════════════════════════╗");
  console.log("║       🚀 SilverDev Facebook Bot            ║");
  console.log("║       Page: SilverDev | App: DigitalMaster ║");
  console.log("╚═══════════════════════════════════════════╝\n");

  // 1. Vérifier le token Facebook
  console.log("1️⃣  Vérification du token Facebook...");
  await facebookApi.verifyToken();

  // 2. Vérifier la clé Gemini
  console.log("\n2️⃣  Vérification de la clé Gemini AI...");
  const geminiOk = await verifyGeminiKey();
  if (!geminiOk) {
    console.log("⚠️  Gemini non disponible — utilisation des templates de secours");
  }

  // 3. Configurer le profil Messenger
  console.log("\n2️⃣  Configuration du profil Messenger...");
  await setupMessengerProfile();

  // 3. Démarrer le planificateur de publications
  console.log("\n3️⃣  Démarrage du planificateur...");
  startScheduler();

  // 4. Démarrer le scanner de commentaires
  console.log("\n4️⃣  Démarrage du scanner de commentaires...");
  startCommentScanner();

  // 5. Démarrer le serveur Express
  app.listen(PORT, () => {
    console.log(`\n5️⃣  ✅ Serveur webhook en écoute sur le port ${PORT}`);
    console.log(`\n🌐 Endpoints disponibles:`);
    console.log(`   GET  http://localhost:${PORT}/          → Statut`);
    console.log(`   GET  http://localhost:${PORT}/health    → Santé`);
    console.log(`   GET  http://localhost:${PORT}/webhook   → Vérification Facebook`);
    console.log(`   POST http://localhost:${PORT}/webhook   → Événements Facebook`);
    console.log(`   POST http://localhost:${PORT}/admin/publish → Publication manuelle`);
    console.log("\n✅ Bot entièrement démarré et opérationnel !\n");

    // Envoyer email de confirmation démarrage
    sendStartupEmail().catch(() => {});

    // Rapport hebdomadaire automatique chaque lundi à 7h (heure Douala)
    import("node-cron").then((cron) => {
      cron.schedule("0 6 * * 1", () => {
        const stats = getSafetyStats() as any;
        sendWeeklyReport({
          postsPublished: stats.postsToday ?? 0,
          commentsReplied: stats.commentsToday ?? 0,
          messagesSent: stats.messagesToday ?? 0,
        }).catch(() => {});
      }, { timezone: "Africa/Douala" });
    });
  });
}

// Gestion des erreurs non capturées
process.on("unhandledRejection", (reason) => {
  console.error("❌ Erreur non gérée:", reason);
  sendCriticalAlert("Erreur non gérée", String(reason)).catch(() => {});
});

process.on("SIGTERM", () => {
  console.log("\n⚠️  Signal SIGTERM reçu — arrêt gracieux...");
  process.exit(0);
});

// Lancement
bootstrap().catch(async (error) => {
  console.error("❌ Erreur fatale au démarrage:", error);
  await sendCriticalAlert(
    "Token Facebook expiré ou invalide",
    "Allez sur developers.facebook.com/tools/explorer → Générez un nouveau token → Mettez à jour FACEBOOK_PAGE_ACCESS_TOKEN sur Railway"
  ).catch(() => {});
  process.exit(1);
});
