'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle, XCircle, Clock, Users, ChevronDown, AlertCircle, Loader2 } from 'lucide-react';

type Session = {
  id: string;
  titre: string;
  date_debut: string;
  organisation_id: string;
};

type Profile = {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
};

type Inscription = {
  id: string;
  etudiant_id: string;
  session_id: string;
  profiles: Profile;
};

type Presence = {
  session_id: string;
  etudiant_id: string;
  statut: 'present' | 'absent' | 'retard';
  organisation_id: string;
  heure_arrivee?: string;
};

export default function PresencesPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [presences, setPresences] = useState<Presence[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const supabase = createClient();

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        setUser(user);
        
        // Fetch user's profile to get organization_id and role
        const { data: profile } = await supabase
          .from('profiles')
          .select('organisation_id, role')
          .eq('id', user.id)
          .single();
          
        if (profile) {
          let query = supabase
            .from('sessions')
            .select('id, titre, date_debut, organisation_id')
            .eq('organisation_id', profile.organisation_id);
            
          if (profile.role === 'formateur') {
            query = query.eq('formateur_id', user.id);
          }
          
          const { data: sessionsData, error } = await query.order('date_debut', { ascending: false });
          
          if (error) throw error;
          setSessions(sessionsData || []);
        }
      } catch (error) {
        console.error('Error loading sessions:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadInitialData();
  }, [supabase]);

  useEffect(() => {
    if (!selectedSessionId) {
      setInscriptions([]);
      setPresences([]);
      return;
    }
    
    async function loadStudentsAndPresences() {
      try {
        setLoadingStudents(true);
        // Fetch inscriptions with profiles
        const { data: inscriptionsData, error: inscriptsError } = await supabase
          .from('inscriptions')
          .select(`
            id, 
            etudiant_id, 
            session_id, 
            profiles (id, full_name, email, avatar_url)
          `)
          .eq('session_id', selectedSessionId);
          
        if (inscriptsError) throw inscriptsError;
        
        setInscriptions(inscriptionsData as any[] || []);
        
        // Fetch presences
        const { data: presencesData, error: presencesError } = await supabase
          .from('presences')
          .select('*')
          .eq('session_id', selectedSessionId);
          
        if (presencesError) throw presencesError;
        
        setPresences(presencesData || []);
        
      } catch (error) {
        console.error('Error loading students:', error);
      } finally {
        setLoadingStudents(false);
      }
    }
    
    loadStudentsAndPresences();
  }, [selectedSessionId, supabase]);

  const handlePresenceUpdate = async (etudiantId: string, status: 'present' | 'absent' | 'retard') => {
    const session = sessions.find(s => s.id === selectedSessionId);
    if (!session) return;
    
    const newPresence = {
      session_id: selectedSessionId,
      etudiant_id: etudiantId,
      statut: status,
      organisation_id: session.organisation_id,
      heure_arrivee: new Date().toISOString()
    };
    
    // Update local state optimistically
    setPresences(prev => {
      const existing = prev.findIndex(p => p.etudiant_id === etudiantId);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = newPresence;
        return next;
      }
      return [...prev, newPresence];
    });
    
    try {
      const { error } = await supabase
        .from('presences')
        .upsert(newPresence, { onConflict: 'session_id, etudiant_id' }); 
        
      if (error) throw error;
      
    } catch (error) {
      console.error('Error updating presence:', error);
      // Ideally we would revert state here if it fails
    }
  };

  const presentCount = presences.filter(p => p.statut === 'present').length;
  const absentCount = presences.filter(p => p.statut === 'absent').length;
  const retardCount = presences.filter(p => p.statut === 'retard').length;

  function getInitials(name: string) {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 text-white min-h-screen">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="w-8 h-8 text-primary" />
          Présences
        </h1>
        <p className="text-zinc-400">Gérez les présences de vos étudiants pour chaque session.</p>
      </div>

      <div className="glass-card p-6 space-y-4">
        <label className="block text-sm font-medium text-zinc-300">Sélectionner une session</label>
        {loading ? (
          <div className="flex items-center gap-2 text-zinc-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Chargement des sessions...</span>
          </div>
        ) : (
          <div className="relative">
            <select 
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg p-3 appearance-none text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">-- Choisir une session --</option>
              {sessions.map(session => (
                <option key={session.id} value={session.id}>
                  {session.titre} - {new Date(session.date_debut).toLocaleDateString('fr-FR', {
                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3.5 w-5 h-5 text-zinc-400 pointer-events-none" />
          </div>
        )}
      </div>

      {selectedSessionId && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-card p-4 flex flex-col items-center justify-center text-center gap-2 border-t-4 border-t-green-500">
              <span className="text-3xl font-bold text-green-400">{presentCount}</span>
              <span className="text-sm text-zinc-400 uppercase tracking-wider">Présents</span>
            </div>
            <div className="glass-card p-4 flex flex-col items-center justify-center text-center gap-2 border-t-4 border-t-red-500">
              <span className="text-3xl font-bold text-red-400">{absentCount}</span>
              <span className="text-sm text-zinc-400 uppercase tracking-wider">Absents</span>
            </div>
            <div className="glass-card p-4 flex flex-col items-center justify-center text-center gap-2 border-t-4 border-t-orange-500">
              <span className="text-3xl font-bold text-orange-400">{retardCount}</span>
              <span className="text-sm text-zinc-400 uppercase tracking-wider">Retards</span>
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-white/5">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                Liste des étudiants
                {loadingStudents && <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />}
              </h2>
            </div>
            
            <div className="divide-y divide-white/5">
              {inscriptions.length === 0 && !loadingStudents ? (
                <div className="p-8 text-center text-zinc-400 flex flex-col items-center gap-2">
                  <AlertCircle className="w-8 h-8 opacity-50" />
                  <p>Aucun étudiant inscrit à cette session.</p>
                </div>
              ) : (
                inscriptions.map(inscription => {
                  // Handle potential array or object from Supabase join
                  const profile = Array.isArray(inscription.profiles) ? inscription.profiles[0] : inscription.profiles;
                  const fullName = profile?.full_name || 'Étudiant inconnu';
                  const email = profile?.email || 'Email non renseigné';
                  const presence = presences.find(p => p.etudiant_id === inscription.etudiant_id);
                  const status = presence?.statut;

                  return (
                    <div key={inscription.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10 flex-shrink-0 overflow-hidden">
                          {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt={fullName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-medium text-zinc-300">{getInitials(fullName)}</span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-white">{fullName}</p>
                            {status && (
                              <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                                status === 'present' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                status === 'absent' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                'bg-orange-500/10 text-orange-400 border-orange-500/20'
                              }`}>
                                {status === 'present' ? 'Présent' : status === 'absent' ? 'Absent' : 'Retard'}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-zinc-400">{email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePresenceUpdate(inscription.etudiant_id, 'present')}
                          className={`btn flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                            status === 'present' 
                              ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                              : 'bg-zinc-800/50 text-zinc-400 border border-white/5 hover:bg-zinc-800 hover:text-zinc-200'
                          }`}
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span className="hidden sm:inline">Présent</span>
                        </button>
                        
                        <button
                          onClick={() => handlePresenceUpdate(inscription.etudiant_id, 'absent')}
                          className={`btn flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                            status === 'absent' 
                              ? 'bg-red-500/20 text-red-400 border border-red-500/50' 
                              : 'bg-zinc-800/50 text-zinc-400 border border-white/5 hover:bg-zinc-800 hover:text-zinc-200'
                          }`}
                        >
                          <XCircle className="w-4 h-4" />
                          <span className="hidden sm:inline">Absent</span>
                        </button>
                        
                        <button
                          onClick={() => handlePresenceUpdate(inscription.etudiant_id, 'retard')}
                          className={`btn flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                            status === 'retard' 
                              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' 
                              : 'bg-zinc-800/50 text-zinc-400 border border-white/5 hover:bg-zinc-800 hover:text-zinc-200'
                          }`}
                        >
                          <Clock className="w-4 h-4" />
                          <span className="hidden sm:inline">Retard</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
