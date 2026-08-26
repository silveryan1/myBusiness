import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, BookOpen, Clock, Tag } from 'lucide-react';

export default async function FormationsPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  let formations: any[] = [];
  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('organisation_id')
      .eq('id', userId)
      .single();
      
    if (profile?.organisation_id) {
       const { data } = await supabase
         .from('formations')
         .select('*')
         .eq('organisation_id', profile.organisation_id)
         .order('created_at', { ascending: false });
       formations = data || [];
    }
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'published': return <span className="badge badge-success">Publié</span>;
      case 'archived': return <span className="badge badge-error">Archivé</span>;
      case 'draft': 
      default:
         return <span className="badge badge-warning">Brouillon</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary gradient-text">Formations</h1>
          <p className="text-secondary mt-1">Gérez votre catalogue de formations</p>
        </div>
        <Link href="/formations/nouveau" className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle formation
        </Link>
      </div>

      {formations.length === 0 ? (
        <div className="glass-card p-12 text-center flex flex-col items-center">
          <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-secondary" />
          </div>
          <h2 className="text-lg font-medium text-primary mb-2">Aucune formation</h2>
          <p className="text-secondary mb-6">Commencez par créer votre première formation pour votre catalogue.</p>
          <Link href="/formations/nouveau" className="btn btn-primary">
            Créer une formation
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {formations.map((formation) => (
            <div key={formation.id} className="glass-card p-6 flex flex-col hover:border-blue-500/30 transition-colors cursor-pointer group relative">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-lg text-primary line-clamp-2 group-hover:text-blue-400 transition-colors pr-2">
                  {formation.titre}
                </h3>
                {getStatusBadge(formation.status)}
              </div>
              
              <p className="text-secondary text-sm mb-4 line-clamp-2 flex-grow">
                {formation.description || 'Aucune description fournie.'}
              </p>
              
              <div className="space-y-3 mt-auto pt-4 border-t border-white/10">
                <div className="flex items-center text-sm text-secondary">
                  <Tag className="w-4 h-4 mr-2" />
                  {formation.categorie || 'Non catégorisé'}
                </div>
                <div className="flex items-center text-sm text-secondary">
                  <Clock className="w-4 h-4 mr-2" />
                  {formation.duree_heures ? `${formation.duree_heures} heures` : 'Durée non définie'}
                </div>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-xs px-2.5 py-1 bg-white/5 border border-white/10 rounded-md text-secondary capitalize">
                    {formation.niveau || 'debutant'}
                  </span>
                  <span className="font-semibold text-primary">
                    {formation.is_payante && formation.prix ? `${formation.prix} €` : 'Gratuit'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
