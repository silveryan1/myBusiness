// ============================================================
// mailer.ts — Alertes email automatiques pour SilverDev Bot
// Envoie des emails à silveryan535@gmail.com pour surveiller le bot
// ============================================================

import * as dotenv from "dotenv";
dotenv.config();

const ALERT_EMAIL = "silveryan535@gmail.com";
const BOT_NAME = "SilverDev Facebook Bot";

// ─── CLIENT RESEND ────────────────────────────────────────────

async function sendEmail(subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey || apiKey === "VOTRE_RESEND_API_KEY_ICI") {
    console.log(`📧 [Email simulé] À: ${ALERT_EMAIL} | Sujet: ${subject}`);
    console.log("⚠️  RESEND_API_KEY non configuré — email non envoyé (mode simulation)");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SilverDev Bot <onboarding@resend.dev>",
        to: [ALERT_EMAIL],
        subject: subject,
        html: html,
      }),
    });

    if (response.ok) {
      console.log(`✅ Email envoyé: ${subject}`);
      return true;
    } else {
      const err = await response.json();
      console.error(`❌ Erreur envoi email:`, err);
      return false;
    }
  } catch (error) {
    console.error("❌ Impossible d'envoyer l'email:", error);
    return false;
  }
}

// ─── TEMPLATES D'EMAILS ───────────────────────────────────────

/**
 * Email envoyé au démarrage du bot (confirmation)
 */
export async function sendStartupEmail(): Promise<void> {
  const now = new Date().toLocaleString("fr-FR", { timeZone: "Africa/Douala" });
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background: #1877F2; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">✅ ${BOT_NAME} Démarré</h1>
      </div>
      <div style="padding: 24px;">
        <p style="font-size: 16px;">Bonjour <strong>Silver</strong>,</p>
        <p>Votre bot Facebook SilverDev vient de <strong>démarrer avec succès</strong> !</p>
        <div style="background: #f0f7ff; border-left: 4px solid #1877F2; padding: 12px; margin: 16px 0; border-radius: 4px;">
          <p style="margin: 0;"><strong>🕐 Heure:</strong> ${now} (heure Douala)</p>
          <p style="margin: 8px 0 0;"><strong>📄 Page:</strong> SilverDev (ID: 1365838339939707)</p>
          <p style="margin: 8px 0 0;"><strong>🤖 Gemini AI:</strong> ${process.env.GEMINI_API_KEY ? "✅ Actif" : "⚠️ Non configuré"}</p>
          <p style="margin: 8px 0 0;"><strong>🌐 Environnement:</strong> ${process.env.NODE_ENV || "development"}</p>
        </div>
        <p>Le bot va automatiquement :</p>
        <ul>
          <li>📅 Publier 7 posts/semaine sur votre page</li>
          <li>💬 Répondre aux commentaires (délai humain 3-9 min)</li>
          <li>📞 Gérer les messages Messenger</li>
        </ul>
        <p style="color: #666; font-size: 13px;">Si vous n'avez pas lancé ce bot vous-même, vérifiez votre compte Railway immédiatement.</p>
      </div>
      <div style="background: #f5f5f5; padding: 12px; text-align: center; font-size: 12px; color: #888;">
        SilverDev Bot • +237 690 891 052 • silver-portfolio-silk.vercel.app
      </div>
    </div>
  `;
  await sendEmail(`✅ Bot SilverDev démarré — ${now}`, html);
}

/**
 * Email d'alerte critique (token expiré, erreur fatale)
 */
export async function sendCriticalAlert(error: string, details?: string): Promise<void> {
  const now = new Date().toLocaleString("fr-FR", { timeZone: "Africa/Douala" });
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 2px solid #e53e3e; border-radius: 8px; overflow: hidden;">
      <div style="background: #e53e3e; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">🚨 ALERTE — Bot SilverDev Arrêté</h1>
      </div>
      <div style="padding: 24px;">
        <p style="font-size: 16px;">Bonjour <strong>Silver</strong>,</p>
        <p>Votre bot Facebook <strong>rencontre une erreur critique</strong> et s'est arrêté !</p>
        <div style="background: #fff5f5; border-left: 4px solid #e53e3e; padding: 12px; margin: 16px 0; border-radius: 4px;">
          <p style="margin: 0;"><strong>🕐 Heure:</strong> ${now}</p>
          <p style="margin: 8px 0 0;"><strong>❌ Erreur:</strong> ${error}</p>
          ${details ? `<p style="margin: 8px 0 0; font-size: 12px; color: #666;"><strong>Détails:</strong> ${details}</p>` : ""}
        </div>
        <h3>🔧 Actions à faire MAINTENANT :</h3>
        <ol>
          <li>Allez sur <a href="https://developers.facebook.com/tools/explorer">Graph API Explorer</a></li>
          <li>Générez un nouveau token pour la page <strong>SilverDev</strong></li>
          <li>Mettez à jour la variable <code>FACEBOOK_PAGE_ACCESS_TOKEN</code> sur <a href="https://railway.app">Railway</a></li>
          <li>Le bot redémarrera automatiquement</li>
        </ol>
        <p>Pour toute aide : répondez à cet email.</p>
      </div>
      <div style="background: #f5f5f5; padding: 12px; text-align: center; font-size: 12px; color: #888;">
        SilverDev Bot • +237 690 891 052
      </div>
    </div>
  `;
  await sendEmail(`🚨 ALERTE CRITIQUE — Bot SilverDev arrêté`, html);
}

/**
 * Rapport hebdomadaire automatique (chaque lundi matin)
 */
export async function sendWeeklyReport(stats: {
  postsPublished: number;
  commentsReplied: number;
  messagesSent: number;
}): Promise<void> {
  const now = new Date().toLocaleString("fr-FR", { timeZone: "Africa/Douala" });
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background: #38a169; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">📊 Rapport Hebdomadaire SilverDev</h1>
        <p style="margin: 8px 0 0; opacity: 0.9;">${now}</p>
      </div>
      <div style="padding: 24px;">
        <p>Bonjour <strong>Silver</strong>, voici ce que votre bot a accompli cette semaine :</p>
        <div style="display: flex; gap: 16px; margin: 20px 0;">
          <div style="flex: 1; background: #ebf8ff; border-radius: 8px; padding: 16px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #1877F2;">${stats.postsPublished}</div>
            <div style="color: #555; margin-top: 4px;">📅 Posts publiés</div>
          </div>
          <div style="flex: 1; background: #f0fff4; border-radius: 8px; padding: 16px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #38a169;">${stats.commentsReplied}</div>
            <div style="color: #555; margin-top: 4px;">💬 Commentaires</div>
          </div>
          <div style="flex: 1; background: #fffaf0; border-radius: 8px; padding: 16px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #dd6b20;">${stats.messagesSent}</div>
            <div style="color: #555; margin-top: 4px;">📨 Messages</div>
          </div>
        </div>
        <p>✅ Votre bot fonctionne parfaitement ! La semaine prochaine, il continuera à promouvoir vos services automatiquement.</p>
        <p style="color: #666; font-size: 13px;">🌐 <a href="https://silver-portfolio-silk.vercel.app/">Voir votre portfolio</a> • 📱 WhatsApp: +237 690 891 052</p>
      </div>
      <div style="background: #f5f5f5; padding: 12px; text-align: center; font-size: 12px; color: #888;">
        SilverDev Bot — Rapport automatique du ${now}
      </div>
    </div>
  `;
  await sendEmail(`📊 Rapport hebdomadaire SilverDev Bot`, html);
}
