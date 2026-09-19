// ============================================================
// get-permanent-token.ts
// Échange un token temporaire contre un token de page PERMANENT
// ============================================================

import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config();

const APP_ID = process.env.FACEBOOK_APP_ID || "1654503223012170";
const APP_SECRET = process.env.FACEBOOK_APP_SECRET || "";
const PAGE_ID = process.env.FACEBOOK_PAGE_ID || "1365838339939707";
const USER_TOKEN = process.argv[2] || process.env.FACEBOOK_PAGE_ACCESS_TOKEN || "";

async function generateNeverExpiringToken() {
  if (!APP_SECRET) {
    console.error("❌ Erreur: FACEBOOK_APP_SECRET est manquant dans le fichier .env");
    process.exit(1);
  }

  if (!USER_TOKEN) {
    console.error("❌ Utilisation: npx ts-node src/scripts/get-permanent-token.ts <VOTRE_USER_TOKEN>");
    process.exit(1);
  }

  try {
    console.log("🔄 Étape 1 : Échange contre un Long-Lived Token (60 jours)...");
    const exchangeRes = await axios.get("https://graph.facebook.com/v19.0/oauth/access_token", {
      params: {
        grant_type: "fb_exchange_token",
        client_id: APP_ID,
        client_secret: APP_SECRET,
        fb_exchange_token: USER_TOKEN,
      },
    });

    const longLivedUserToken = exchangeRes.data.access_token;
    console.log("✅ Token longue durée utilisateur obtenu !");

    console.log("\n🔄 Étape 2 : Récupération du Page Access Token PERMANENT (Jamais d'expiration)...");
    const pageRes = await axios.get(`https://graph.facebook.com/v19.0/${PAGE_ID}`, {
      params: {
        fields: "access_token,name",
        access_token: longLivedUserToken,
      },
    });

    const permanentPageToken = pageRes.data.access_token;
    console.log(`\n🎉 SUCCÈS ! Page trouvée: ${pageRes.data.name}`);
    console.log("═════════════════════════════════════════════════════════════════");
    console.log("🔑 VOTRE TOKEN PERMANENT (Copiez ceci) :");
    console.log("═════════════════════════════════════════════════════════════════");
    console.log(permanentPageToken);
    console.log("═════════════════════════════════════════════════════════════════\n");
  } catch (error: any) {
    console.error("❌ Erreur lors de la génération:", error.response?.data || error.message);
  }
}

generateNeverExpiringToken();
