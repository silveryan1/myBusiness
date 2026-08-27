import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function InscriptionsPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role || 'etudiant'
  const is_admin = role === 'admin'

  // Fetch inscriptions based on role
  let query = supabase
    .from('inscriptions')
    .select(`
      id,
      statut,
      created_at,
      etudiant:profiles!inscriptions_etudiant_id_fkey(prenom, nom, email, avatar_url),
      session:sessions(
        titre, 
        date_debut, 
        date_fin, 
        formation:formations(titre)
      )
    `)
    .order('created_at', { ascending: false })

  if (!is_admin) {
    // Non-admins (etudiants) only see their own inscriptions
    query = query.eq('etudiant_id', user.id)
  }

  const { data: rawInscriptions, error } = await query

  if (error) {
    console.error('Erreur lors du chargement des inscriptions:', error)
  }

  const inscriptions = rawInscriptions || []

  const stats = {
    total: inscriptions.length,
    confirmees: inscriptions.filter((i: any) => i.statut === 'confirmee').length,
    en_attente: inscriptions.filter((i: any) => i.statut === 'en_attente').length,
    annulees: inscriptions.filter((i: any) => i.statut === 'annulee').length,
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Inscriptions</h1>
          <p className="text-white/60">Gérez les inscriptions aux sessions de formation.</p>
        </div>
        {is_admin && (
          <Link href="/inscriptions/nouveau" className="glass-card px-6 py-2.5 rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white font-medium transition-all shadow-lg border border-white/10">
            Nouvelle inscription
          </Link>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-white' },
          { label: 'Confirmées', value: stats.confirmees, color: 'text-green-400' },
          { label: 'En attente', value: stats.en_attente, color: 'text-yellow-400' },
          { label: 'Annulées', value: stats.annulees, color: 'text-red-400' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-5 rounded-xl flex flex-col border border-white/10 bg-white/5 backdrop-blur-md">
            <span className="text-sm font-medium text-white/60">{stat.label}</span>
            <span className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden">
        {inscriptions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-sm font-semibold text-white/70">
                  <th className="p-4">Étudiant</th>
                  <th className="p-4">Formation</th>
                  <th className="p-4">Session</th>
                  <th className="p-4">Date session</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4">Date inscription</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-sm text-white/90">
                {inscriptions.map((inscription: any) => {
                  const etudiant = Array.isArray(inscription.etudiant) ? inscription.etudiant[0] : inscription.etudiant
                  const session = Array.isArray(inscription.session) ? inscription.session[0] : inscription.session
                  const formationData = session?.formation
                  const formation = Array.isArray(formationData) ? formationData[0] : formationData
                  
                  return (
                    <tr key={inscription.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {etudiant?.avatar_url ? (
                              <img src={etudiant.avatar_url} alt={`${etudiant?.prenom || ''} ${etudiant?.nom || ''}`} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-bold text-white/70 uppercase">
                                {etudiant?.prenom?.[0] || ''}{etudiant?.nom?.[0] || ''}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-white">{etudiant?.prenom} {etudiant?.nom}</div>
                            <div className="text-xs text-white/50">{etudiant?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-medium">{formation?.titre || '-'}</td>
                      <td className="p-4">{session?.titre || '-'}</td>
                      <td className="p-4 text-white/70">
                        {session?.date_debut ? new Date(session.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                          inscription.statut === 'confirmee' ? 'badge-success bg-green-500/10 text-green-400 border-green-500/20' :
                          inscription.statut === 'en_attente' ? 'badge-warning bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                          inscription.statut === 'annulee' ? 'badge-error bg-red-500/10 text-red-400 border-red-500/20' :
                          inscription.statut === 'completee' ? 'badge-primary bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          'bg-white/10 text-white/70 border-white/20'
                        }`}>
                          {inscription.statut === 'confirmee' ? 'Confirmée' :
                           inscription.statut === 'en_attente' ? 'En attente' :
                           inscription.statut === 'annulee' ? 'Annulée' :
                           inscription.statut === 'completee' ? 'Complétée' : inscription.statut}
                        </span>
                      </td>
                      <td className="p-4 text-white/70">
                        {inscription.created_at ? new Date(inscription.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td className="p-4 text-right">
                        <Link href={`/inscriptions/${inscription.id}`} className="inline-flex items-center justify-center px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 text-xs font-medium transition-colors">
                          Voir détails
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-5 border border-white/10 shadow-inner">
              <svg className="w-8 h-8 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Aucune inscription trouvée</h3>
            <p className="text-white/50 mb-8 max-w-md mx-auto text-sm">
              {is_admin 
                ? "Il n'y a actuellement aucune inscription enregistrée dans le système pour votre organisation."
                : "Vous n'êtes inscrit à aucune session de formation pour le moment."}
            </p>
            {is_admin && (
              <Link href="/inscriptions/nouveau" className="glass-card px-5 py-2.5 rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white font-medium transition-all shadow-lg border border-white/10 text-sm">
                Créer la première inscription
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
