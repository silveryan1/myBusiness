"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

export default function NouvelleFormationPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    objectifs: '',
    prerequis: '',
    duree_heures: '',
    niveau: 'debutant',
    categorie: '',
    is_payante: false,
    prix: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organisation_id')
        .eq('id', user.id)
        .single();
        
      if (!profile?.organisation_id) throw new Error('Organisation introuvable');

      const { error: insertError } = await supabase.from('formations').insert({
        organisation_id: profile.organisation_id,
        titre: formData.titre,
        description: formData.description,
        objectifs: formData.objectifs,
        prerequis: formData.prerequis,
        duree_heures: formData.duree_heures ? parseFloat(formData.duree_heures) : null,
        niveau: formData.niveau,
        categorie: formData.categorie,
        is_payante: formData.is_payante,
        prix: formData.is_payante && formData.prix ? parseFloat(formData.prix) : null,
        status: 'draft'
      });

      if (insertError) throw insertError;
      
      router.push('/formations');
      router.refresh();
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Une erreur est survenue lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center space-x-4">
        <Link href="/formations" className="p-2 hover:bg-white/5 rounded-full transition-colors text-secondary hover:text-primary">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-primary gradient-text">Nouvelle formation</h1>
          <p className="text-secondary mt-1">Créez une nouvelle formation pour votre catalogue</p>
        </div>
      </div>

      <div className="glass-card p-6 md:p-8">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="titre" className="form-label">Titre de la formation *</label>
              <input
                type="text"
                id="titre"
                name="titre"
                required
                value={formData.titre}
                onChange={handleChange}
                className="form-input"
                placeholder="Ex: Formation Next.js Avancé"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="form-label">Description</label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="form-input resize-none"
                placeholder="Description courte de la formation..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="categorie" className="form-label">Catégorie</label>
                <input
                  type="text"
                  id="categorie"
                  name="categorie"
                  value={formData.categorie}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Ex: Développement Web"
                />
              </div>
              
              <div>
                <label htmlFor="niveau" className="form-label">Niveau</label>
                <select
                  id="niveau"
                  name="niveau"
                  value={formData.niveau}
                  onChange={handleChange}
                  className="form-input bg-[var(--bg-app)]"
                >
                  <option value="debutant">Débutant</option>
                  <option value="intermediaire">Intermédiaire</option>
                  <option value="avance">Avancé</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                <label htmlFor="duree_heures" className="form-label">Durée estimée (heures)</label>
                <input
                  type="number"
                  id="duree_heures"
                  name="duree_heures"
                  min="0"
                  step="0.5"
                  value={formData.duree_heures}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Ex: 10"
                />
              </div>
            </div>
            
            <div className="pt-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_payante"
                  checked={formData.is_payante}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-white/20 bg-black/20 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                />
                <span className="text-primary font-medium">Formation payante</span>
              </label>
            </div>

            {formData.is_payante && (
              <div className="animate-fade-in">
                <label htmlFor="prix" className="form-label">Prix (€)</label>
                <input
                  type="number"
                  id="prix"
                  name="prix"
                  min="0"
                  step="0.01"
                  required={formData.is_payante}
                  value={formData.prix}
                  onChange={handleChange}
                  className="form-input md:w-1/2"
                  placeholder="Ex: 49.99"
                />
              </div>
            )}
            
            <div className="pt-4 border-t border-white/10 space-y-4">
               <div>
                <label htmlFor="objectifs" className="form-label">Objectifs pédagogiques</label>
                <textarea
                  id="objectifs"
                  name="objectifs"
                  rows={3}
                  value={formData.objectifs}
                  onChange={handleChange}
                  className="form-input resize-none"
                  placeholder="Ce que les participants sauront faire à l'issue de la formation..."
                />
              </div>
              
              <div>
                <label htmlFor="prerequis" className="form-label">Prérequis</label>
                <textarea
                  id="prerequis"
                  name="prerequis"
                  rows={2}
                  value={formData.prerequis}
                  onChange={handleChange}
                  className="form-input resize-none"
                  placeholder="Connaissances ou matériel nécessaires..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-white/10 space-x-4">
            <Link href="/formations" className="btn btn-secondary">
              Annuler
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary min-w-[140px] flex justify-center"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
