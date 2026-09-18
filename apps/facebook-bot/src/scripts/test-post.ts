// ============================================================
// scripts/test-post.ts — Script de test pour la publication
// Publie un post de test sur la page SilverDev
// ============================================================

import * as dotenv from "dotenv";
dotenv.config({ path: "../../.env" });
dotenv.config(); // aussi .env local

import { facebookApi } from "../facebook-api";
import { getNextPost, formatPost } from "../content/posts";

async function testPost() {
  console.log("\n🧪 Test de publication...\n");

  try {
    // Vérifier le token
    const page = await facebookApi.verifyToken();
    console.log(`✅ Page connectée: ${page.name}\n`);

    // Récupérer un post de test
    const template = getNextPost("site-web");
    const message = formatPost(template);

    console.log("📝 Post à publier:");
    console.log("─────────────────────────────────────────────");
    console.log(message);
    console.log("─────────────────────────────────────────────\n");

    // Publier
    const result = await facebookApi.publishPost(message);
    console.log(`\n✅ SUCCESS! Post publié: https://www.facebook.com/${result.id}`);
  } catch (error: any) {
    console.error("❌ Erreur:", error.response?.data || error.message);
    process.exit(1);
  }
}

testPost();
