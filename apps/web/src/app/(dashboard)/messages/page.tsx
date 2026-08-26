"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface Message {
  id: string;
  contenu: string;
  sender_id: string;
  created_at: string;
  is_lu: boolean;
  sender: { prenom: string; nom: string } | null;
}

interface Contact {
  id: string;
  prenom: string;
  nom: string;
  role: string;
}

export default function MessagesPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setSending] = useState(false);
  const [orgId, setOrgId] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("organisation_id")
        .eq("id", user.id)
        .single();

      setOrgId(profile?.organisation_id || "");

      const { data } = await supabase
        .from("profiles")
        .select("id, prenom, nom, role")
        .eq("organisation_id", profile?.organisation_id || "")
        .neq("id", user.id)
        .eq("is_active", true);

      setContacts(data || []);
    }
    init();
  }, []);

  useEffect(() => {
    if (!selectedContact || !currentUserId) return;

    const supabase = createClient();
    const contact = selectedContact;

    async function loadMessages() {
      const { data } = await supabase
        .from("messages")
        .select("*, sender:profiles!messages_sender_id_fkey(prenom, nom)")
        .or(
          `and(sender_id.eq.${currentUserId},receiver_id.eq.${contact.id}),and(sender_id.eq.${contact.id},receiver_id.eq.${currentUserId})`
        )
        .order("created_at");
      setMessages(data || []);
    }

    loadMessages();

    // Realtime subscription
    const channel = supabase
      .channel(`messages-${selectedContact.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
      }, () => {
        loadMessages();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedContact, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact) return;
    setSending(true);

    const supabase = createClient();
    await supabase.from("messages").insert({
      organisation_id: orgId,
      sender_id: currentUserId,
      receiver_id: selectedContact.id,
      contenu: newMessage.trim(),
      type: "direct",
    });

    setNewMessage("");
    setSending(false);
  }

  const roleLabel: Record<string, string> = {
    admin: "Admin", formateur: "Formateur", etudiant: "Étudiant", super_admin: "Super Admin"
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Messagerie</h1>
        <p className="text-slate-400 mt-1">Communiquez avec les membres de votre organisation</p>
      </div>

      <div className="grid grid-cols-12 gap-4" style={{ height: "calc(100vh - 220px)", minHeight: "500px" }}>
        {/* Contacts */}
        <div className="col-span-4 glass-card overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/5">
            <h2 className="font-semibold text-white text-sm">Contacts</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {contacts.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">Aucun contact</div>
            ) : (
              contacts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedContact(c)}
                  className={`w-full flex items-center gap-3 p-3 text-left transition-all hover:bg-white/[0.04] border-b border-white/[0.03] ${
                    selectedContact?.id === c.id ? "bg-indigo-500/10 border-l-2 border-l-indigo-500" : ""
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                    {c.prenom?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white truncate">{c.prenom} {c.nom}</div>
                    <div className="text-xs text-slate-500">{roleLabel[c.role]}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="col-span-8 glass-card overflow-hidden flex flex-col">
          {!selectedContact ? (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <div className="text-4xl mb-3">💬</div>
                <p className="text-slate-400">Sélectionnez un contact pour démarrer une conversation</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-4 border-b border-white/5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                  {selectedContact.prenom?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-white">{selectedContact.prenom} {selectedContact.nom}</div>
                  <div className="text-xs text-slate-400">{roleLabel[selectedContact.role]}</div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center text-slate-500 text-sm py-8">
                    Démarrez la conversation 👋
                  </div>
                )}
                {messages.map((msg) => {
                  const isMe = msg.sender_id === currentUserId;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                          isMe
                            ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-sm"
                            : "bg-white/[0.06] text-slate-200 rounded-bl-sm"
                        }`}
                      >
                        <p>{msg.contenu}</p>
                        <p className={`text-xs mt-1 ${isMe ? "text-indigo-200" : "text-slate-500"}`}>
                          {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={sendMessage} className="p-4 border-t border-white/5 flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="form-input flex-1"
                  placeholder="Écrire un message..."
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="btn btn-primary px-4"
                  disabled={loading || !newMessage.trim()}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
