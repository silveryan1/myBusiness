// ============================================================
// facebook-api.ts — Client centralisé pour l'API Graph Facebook
// Page: SilverDev (ID: 1365838339939707)
// App:  DigitalMaster (ID: 1654503223012170)
// ============================================================

import axios, { AxiosInstance } from "axios";
import * as dotenv from "dotenv";

dotenv.config();

const GRAPH_API_BASE = "https://graph.facebook.com/v19.0";

export interface FacebookPost {
  id: string;
  message: string;
  created_time: string;
}

export interface FacebookComment {
  id: string;
  message: string;
  from?: { id: string; name: string };
  created_time: string;
  post_id?: string;
}

export interface FacebookMessage {
  id: string;
  message: string;
  from?: { id: string; name: string };
  created_time: string;
  thread_id?: string;
}

class FacebookApiClient {
  private client: AxiosInstance;
  private pageId: string;
  private pageAccessToken: string;

  constructor() {
    this.pageId = process.env.FACEBOOK_PAGE_ID || "";
    this.pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN || "";

    if (!this.pageId || !this.pageAccessToken) {
      throw new Error(
        "❌ Variables d'environnement manquantes: FACEBOOK_PAGE_ID et FACEBOOK_PAGE_ACCESS_TOKEN sont requis."
      );
    }

    this.client = axios.create({
      baseURL: GRAPH_API_BASE,
      params: { access_token: this.pageAccessToken },
      timeout: 15000,
    });
  }

  // ─── PUBLICATION ──────────────────────────────────────────

  /**
   * Publie un post texte (avec image optionnelle) sur la page Facebook
   */
  async publishPost(
    message: string,
    imageUrl?: string
  ): Promise<{ id: string }> {
    try {
      let response;

      if (imageUrl) {
        // Post avec photo
        response = await this.client.post(`/${this.pageId}/photos`, {
          message,
          url: imageUrl,
          published: true,
        });
      } else {
        // Post texte simple
        response = await this.client.post(`/${this.pageId}/feed`, {
          message,
          published: true,
        });
      }

      console.log(`✅ Post publié avec succès! ID: ${response.data.id}`);
      return response.data;
    } catch (error: any) {
      console.error(
        "❌ Erreur lors de la publication du post:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  // ─── COMMENTAIRES ─────────────────────────────────────────

  /**
   * Récupère tous les posts récents de la page avec leurs commentaires
   */
  async getRecentPosts(limit = 10): Promise<FacebookPost[]> {
    try {
      const response = await this.client.get(`/${this.pageId}/feed`, {
        params: {
          fields: "id,message,created_time",
          limit,
        },
      });
      return response.data.data || [];
    } catch (error: any) {
      console.error(
        "❌ Erreur récupération posts:",
        error.response?.data || error.message
      );
      return [];
    }
  }

  /**
   * Récupère les commentaires d'un post spécifique
   */
  async getPostComments(postId: string): Promise<FacebookComment[]> {
    try {
      const response = await this.client.get(`/${postId}/comments`, {
        params: {
          fields: "id,message,from,created_time",
          filter: "stream",
        },
      });
      return response.data.data || [];
    } catch (error: any) {
      console.error(
        `❌ Erreur récupération commentaires du post ${postId}:`,
        error.response?.data || error.message
      );
      return [];
    }
  }

  /**
   * Répond à un commentaire
   */
  async replyToComment(
    commentId: string,
    message: string
  ): Promise<{ id: string }> {
    try {
      const response = await this.client.post(`/${commentId}/comments`, {
        message,
      });
      console.log(
        `✅ Réponse au commentaire ${commentId}: "${message.substring(0, 50)}..."`
      );
      return response.data;
    } catch (error: any) {
      console.error(
        `❌ Erreur réponse commentaire ${commentId}:`,
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * Aime un commentaire (like)
   */
  async likeComment(commentId: string): Promise<void> {
    try {
      await this.client.post(`/${commentId}/likes`);
      console.log(`👍 Commentaire ${commentId} aimé`);
    } catch (error: any) {
      console.error(
        `❌ Erreur like commentaire:`,
        error.response?.data || error.message
      );
    }
  }

  // ─── MESSAGES (MESSENGER) ─────────────────────────────────

  /**
   * Envoie un message Messenger à un utilisateur
   */
  async sendMessage(
    recipientId: string,
    message: string
  ): Promise<{ recipient_id: string; message_id: string }> {
    try {
      const response = await this.client.post(`/me/messages`, {
        recipient: { id: recipientId },
        message: { text: message },
        messaging_type: "RESPONSE",
      });
      console.log(`✅ Message envoyé à ${recipientId}`);
      return response.data;
    } catch (error: any) {
      console.error(
        `❌ Erreur envoi message à ${recipientId}:`,
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * Envoie un message Messenger avec des boutons rapides (Quick Replies)
   */
  async sendMessageWithQuickReplies(
    recipientId: string,
    message: string,
    quickReplies: Array<{ title: string; payload: string }>
  ): Promise<void> {
    try {
      await this.client.post(`/me/messages`, {
        recipient: { id: recipientId },
        message: {
          text: message,
          quick_replies: quickReplies.map((qr) => ({
            content_type: "text",
            title: qr.title,
            payload: qr.payload,
          })),
        },
        messaging_type: "RESPONSE",
      });
      console.log(`✅ Message avec options rapides envoyé à ${recipientId}`);
    } catch (error: any) {
      console.error(
        `❌ Erreur envoi message avec options:`,
        error.response?.data || error.message
      );
    }
  }

  /**
   * Récupère les conversations Messenger récentes
   */
  async getConversations(): Promise<any[]> {
    try {
      const response = await this.client.get(`/${this.pageId}/conversations`, {
        params: {
          fields: "id,messages{id,message,from,created_time}",
          platform: "messenger",
        },
      });
      return response.data.data || [];
    } catch (error: any) {
      console.error(
        "❌ Erreur récupération conversations:",
        error.response?.data || error.message
      );
      return [];
    }
  }

  /**
   * Définit le profil Messenger de la page (menu persistant, etc.)
   */
  async setMessengerProfile(config: object): Promise<void> {
    try {
      await this.client.post(`/me/messenger_profile`, config);
      console.log("✅ Profil Messenger configuré");
    } catch (error: any) {
      console.error(
        "❌ Erreur configuration profil Messenger:",
        error.response?.data || error.message
      );
    }
  }

  /**
   * Vérifie que le token est valide et retourne les infos de la page
   */
  async verifyToken(): Promise<{ id: string; name: string; category: string }> {
    try {
      const response = await this.client.get(`/${this.pageId}`, {
        params: { fields: "id,name,category,fan_count" },
      });
      console.log(
        `✅ Token valide - Page: ${response.data.name} (${response.data.fan_count} fans)`
      );
      return response.data;
    } catch (error: any) {
      console.error(
        "❌ Token invalide ou permissions insuffisantes:",
        error.response?.data || error.message
      );
      throw error;
    }
  }
}

// Export singleton
export const facebookApi = new FacebookApiClient();
export default facebookApi;
