// ============================================================
// scheduler.ts — Planificateur de publications automatiques
// Publie automatiquement des posts selon un calendrier défini
// ============================================================

import cron from "node-cron";
import { facebookApi } from "./facebook-api";
import { getNextPost, formatPost, POST_CATEGORIES } from "./content/posts";
import { generatePost } from "./gemini";
import { canPublishPost, recordPostPublished } from "./safety";

interface ScheduleConfig {
  expression: string;    // Expression cron
  description: string;  // Description lisible
  category?: string;    // Catégorie de post à utiliser (optionnel)
}

// ─── CONFIGURATION DU CALENDRIER ─────────────────────────────
// Format cron: minute heure jour mois jour-semaine
// Lundi=1, Mardi=2, Mercredi=3, Jeudi=4, Vendredi=5, Samedi=6, Dimanche=0

const SCHEDULES: ScheduleConfig[] = [
  {
    expression: "0 9 * * 1",    // Lundi 9h
    description: "Lundi matin — Post service/conseil",
    category: "conseil",
  },
  {
    expression: "0 14 * * 2",   // Mardi 14h
    description: "Mardi après-midi — Post engagement",
    category: "engagement",
  },
  {
    expression: "0 10 * * 3",   // Mercredi 10h
    description: "Mercredi matin — Post site web",
    category: "site-web",
  },
  {
    expression: "0 17 * * 4",   // Jeudi 17h
    description: "Jeudi soir — Post témoignage",
    category: "temoignage",
  },
  {
    expression: "0 11 * * 5",   // Vendredi 11h
    description: "Vendredi matin — Post promotion",
    category: "promotion",
  },
  {
    expression: "0 10 * * 6",   // Samedi 10h
    description: "Samedi matin — Post e-commerce",
    category: "e-commerce",
  },
  {
    expression: "0 15 * * 0",   // Dimanche 15h
    description: "Dimanche après-midi — Post application",
    category: "application",
  },
];

// ─── GESTION DES TÂCHES CRON ─────────────────────────────────

let scheduledTasks: cron.ScheduledTask[] = [];
let isRunning = false;

/**
 * Publie un post automatique — Gemini d'abord, templates en secours
 */
async function autoPublishPost(category?: string): Promise<void> {
  // Vérifier le quota avant de publier
  if (!canPublishPost()) {
    console.log(`⛔ Quota journalier de publications atteint — post ignoré`);
    return;
  }

  try {
    console.log(`\n📅 [${new Date().toLocaleString("fr-FR")}] Publication automatique`);
    console.log(`📂 Catégorie: ${category || "général"}`);

    let message = "";

    // Essayer Gemini d'abord (réponses uniques et naturelles)
    if (process.env.GEMINI_API_KEY) {
      console.log("🤖 Génération du post avec Gemini...");
      message = await generatePost(category || "services de développement web");
    }

    // Fallback sur les templates si Gemini échoue ou n'est pas configuré
    if (!message) {
      console.log("📝 Utilisation d'un template de secours...");
      const template = getNextPost(category);
      message = formatPost(template);
    }

    console.log(`📝 Aperçu: ${message.substring(0, 100)}...`);
    const postResult = await facebookApi.publishPost(message);
    recordPostPublished();

    console.log(`✅ Post publié avec succès!`);

    // Commentaire stratégique automatique
    if (postResult && postResult.id) {
      setTimeout(async () => {
        try {
          const strategicComment = `@followers 🚀 Prêt à transformer votre entreprise avec le digital ? Contactez-moi directement sur WhatsApp au +237 690 891 052 ou visitez mon portfolio pour voir mes réalisations : https://silver-portfolio-silk.vercel.app/`;
          await facebookApi.commentOnPost(postResult.id, strategicComment);
          console.log(`💬 Commentaire stratégique ajouté sur le post !`);
        } catch (e) {
          console.error(`❌ Erreur lors de l'ajout du commentaire stratégique:`, e);
        }
      }, 5000); // Délai de 5 secondes après la publication
    }
    
    console.log(`─────────────────────────────────────────────`);
  } catch (error) {
    console.error(`❌ Erreur lors de la publication automatique:`, error);
  }
}

/**
 * Démarre tous les planificateurs de publications
 */
export function startScheduler(): void {
  if (isRunning) {
    console.log("⚠️  Le planificateur est déjà en cours d'exécution.");
    return;
  }

  console.log("\n🚀 Démarrage du planificateur de publications...");
  console.log(`📅 ${SCHEDULES.length} publications planifiées par semaine\n`);

  SCHEDULES.forEach((schedule) => {
    const task = cron.schedule(
      schedule.expression,
      () => autoPublishPost(schedule.category),
      {
        timezone: "Africa/Douala", // Fuseau horaire Cameroun (UTC+1)
        scheduled: true,
      }
    );

    scheduledTasks.push(task);
    console.log(`  ✅ Planifié: ${schedule.description}`);
  });

  isRunning = true;
  console.log("\n✅ Planificateur démarré ! Publications automatiques actives.");
  console.log("💡 Fuseau horaire: Africa/Douala (UTC+1)\n");
}

/**
 * Arrête tous les planificateurs
 */
export function stopScheduler(): void {
  scheduledTasks.forEach((task) => task.stop());
  scheduledTasks = [];
  isRunning = false;
  console.log("⏹️  Planificateur arrêté.");
}

/**
 * Publie un post immédiatement (test ou publication manuelle)
 */
export async function publishNow(category?: string): Promise<void> {
  console.log(`\n🔥 Publication immédiate (catégorie: ${category || "aléatoire"})...`);
  await autoPublishPost(category);
}

/**
 * Affiche le statut du planificateur
 */
export function getSchedulerStatus(): object {
  return {
    isRunning,
    scheduledTasksCount: scheduledTasks.length,
    schedules: SCHEDULES.map((s) => ({
      description: s.description,
      category: s.category,
      cronExpression: s.expression,
    })),
  };
}
