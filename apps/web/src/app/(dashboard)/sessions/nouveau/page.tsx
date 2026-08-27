'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Save, Loader2, CalendarDays } from 'lucide-react';

export default function NouvelleSessionPage() {
  const router = useRouter();
  const supabase = createClient();

  const [formations, setFormations] = useState<any[]>([]);
  const [formateurs, setFormateurs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    titre: '',
    formation_id: '',
    formateur_id: '',
    date_debut: '',
    date_fin: '',
    places_total: 20,
    lieu: '',
    mode: 'presentiel',
    description: ''
  });

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch formations
        const { data: formationsData, error: formationsError } = await supabase
          .from('formations')
          .select('id, titre');
        
        if (formationsError) throw formationsError;
        setFormations(formationsData || []);

        // Fetch formateurs
        const { data: formateursData, error: formateursError } = await supabase
          .from('profiles')
          .select('id, nom, prenom')
          .eq('role', 'formateur');
          
        if (formateursError) throw formateursError;
        setFormateurs(formateursData || []);
      } catch (err: any) {
        console.error('Erreur lors du chargement des données:', err);
        setError('Erreur lors du chargement des données.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Utilisateur non connecté');

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('organisation_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profileData) throw new Error('Profil introuvable');

      const organisation_id = profileData.organisation_id;

      const sessionData: any = {
        ...formData,
        organisation_id,
        status: 'scheduled',
        places_restantes: formData.places_total,
        places_total: parseInt(formData.places_total.toString(), 10)
      };

      if (!sessionData.titre && sessionData.formation_id) {
        const formation = formations.find(f => f.id === sessionData.formation_id);
        if (formation) {
          sessionData.titre = formation.titre;
        }
      }

      if (!sessionData.formateur_id) {
        sessionData.formateur_id = null;
      }

      const { error: insertError } = await supabase
        .from('sessions')
        .insert(sessionData);

      if (insertError) throw insertError;

      router.push('/sessions');
      router.refresh();
    } catch (err: any) {
      console.error('Erreur lors de la création de la session:', err);
      setError(err.message || 'Une erreur est survenue lors de la création de la session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Link href="/sessions" className="btn btn-secondary mr-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Link>
        <h1 className="text-2xl font-bold text-white flex items-center">
          <CalendarDays className="mr-3 text-primary" />
          Nouvelle Session
        </h1>
      </div>

      <div className="glass-card p-6">
        {error && (
          <div className="bg-red-500/20 text-red-200 border border-red-500/50 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label" htmlFor="formation_id">Formation *</label>
              <select
                id="formation_id"
                name="formation_id"
                required
                className="form-input w-full bg-slate-900 border-slate-700"
                value={formData.formation_id}
                onChange={handleChange}
              >
                <option value="">Sélectionnez une formation</option>
                {formations.map((f: any) => (
                  <option key={f.id} value={f.id}>{f.titre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label" htmlFor="titre">Titre (optionnel)</label>
              <input
                type="text"
                id="titre"
                name="titre"
                className="form-input w-full"
                value={formData.titre}
                onChange={handleChange}
                placeholder="Ex: Session de Printemps (Défaut: titre de la formation)"
              />
            </div>

            <div>
              <label className="form-label" htmlFor="date_debut">Date de début *</label>
              <input
                type="datetime-local"
                id="date_debut"
                name="date_debut"
                required
                className="form-input w-full"
                value={formData.date_debut}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="form-label" htmlFor="date_fin">Date de fin *</label>
              <input
                type="datetime-local"
                id="date_fin"
                name="date_fin"
                required
                className="form-input w-full"
                value={formData.date_fin}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="form-label" htmlFor="formateur_id">Formateur (optionnel)</label>
              <select
                id="formateur_id"
                name="formateur_id"
                className="form-input w-full bg-slate-900 border-slate-700"
                value={formData.formateur_id}
                onChange={handleChange}
              >
                <option value="">Aucun formateur</option>
                {formateurs.map((f: any) => (
                  <option key={f.id} value={f.id}>{f.nom} {f.prenom}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label" htmlFor="places_total">Places totales</label>
              <input
                type="number"
                id="places_total"
                name="places_total"
                min="1"
                required
                className="form-input w-full"
                value={formData.places_total}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="form-label" htmlFor="mode">Mode *</label>
              <select
                id="mode"
                name="mode"
                required
                className="form-input w-full bg-slate-900 border-slate-700"
                value={formData.mode}
                onChange={handleChange}
              >
                <option value="presentiel">Présentiel</option>
                <option value="distanciel">Distanciel</option>
                <option value="hybride">Hybride</option>
              </select>
            </div>

            <div>
              <label className="form-label" htmlFor="lieu">Lieu (optionnel)</label>
              <input
                type="text"
                id="lieu"
                name="lieu"
                className="form-input w-full"
                value={formData.lieu}
                onChange={handleChange}
                placeholder="Ex: Paris, Salle A"
              />
            </div>
          </div>

          <div>
            <label className="form-label" htmlFor="description">Description (optionnelle)</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              className="form-input w-full"
              value={formData.description}
              onChange={handleChange}
              placeholder="Informations complémentaires sur cette session..."
            />
          </div>

          <div className="flex justify-end gap-4 mt-8 border-t border-slate-700 pt-6">
            <Link href="/sessions" className="btn btn-secondary">
              Annuler
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Créer la session
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
