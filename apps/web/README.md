# myBusiness — application web

Gestion d'un centre de formation : catalogue, sessions, inscriptions, présences, notes,
paiements en FCFA (espèces, MTN Mobile Money, Orange Money, virement), certificats vérifiables,
messagerie. Next.js 16 + Supabase (projet `myBusiness`, à part de tout autre projet).

## Les rôles

| Rôle | Ce qu'il fait |
|---|---|
| **Administrateur** | Crée les formations et les sessions, ajoute les membres (compte créé tout de suite, mot de passe provisoire à transmettre), confirme les inscriptions, encaisse les paiements (reçu numéroté), délivre les certificats, voit les rapports. |
| **Formateur** | Voit ses sessions, fait l'appel (présent, retard, absent, excusé), saisit la note finale (sur 20 ou sur 100). |
| **Étudiant** | Parcourt le catalogue publié, demande une place, suit ses inscriptions, ses notes, ses paiements et imprime ses certificats. |

Créer un compte depuis la page d'accueil crée un **nouveau centre** dont on devient l'administrateur
(le centre est créé à la première connexion). Les formateurs et étudiants sont ajoutés par
l'administrateur, page « Membres ».

## Parcours type

1. **Formations** › Nouvelle formation (prix en FCFA) › **Publier**.
2. **Sessions** › Nouvelle session (dates, places, formateur, lieu).
3. L'étudiant demande une place depuis le catalogue (ou l'administrateur l'inscrit depuis la session).
4. **Inscriptions** › Confirmer.
5. **Paiements** › Enregistrer un paiement (pour MTN MoMo / Orange Money : l'ID de transaction du SMS) › le reçu s'imprime ou s'enregistre en PDF.
6. Le formateur fait l'appel et saisit la note finale.
7. **Certificats** › Délivrer (mention proposée d'après la note) › imprimer. Le code en bas du
   certificat se vérifie par n'importe qui sur `/verifier`.

## Mise en service de la base (une seule fois par migration)

Supabase › SQL Editor : exécuter dans l'ordre les fichiers de `supabase/migrations/` pas encore
appliqués. **La 005 (`005_securite_paiements_certificats.sql`) est indispensable** : elle ferme des
failles (un utilisateur pouvait se nommer administrateur) et crée les colonnes des paiements et
des certificats. Elle peut être relancée sans casse.

Un projet Supabase gratuit se met **en pause après une période sans activité** : plus personne ne
peut se connecter. Supabase › le projet › « Restore project ».

## Variables d'environnement (`apps/web/.env.local`, et sur Vercel)

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
(serveur seulement : création des membres et des centres), `NEXT_PUBLIC_APP_URL` (adresse publique,
imprimée sur les certificats ; à défaut, l'adresse de la requête).

## Développement

```bash
npm install            # à la racine du monorepo
cd apps/web
npm run dev            # http://localhost:3000
npx tsc --noEmit       # types
npx eslint src         # règles de code
npx next build         # construction de production (ce que fait Vercel)
```

Toute écriture sensible passe par une action serveur (`src/app/actions/`) qui vérifie la
connexion et le rôle (`exigerRole` dans `src/lib/contexte.ts`) ; la base revérifie tout par ses
règles RLS. Ne jamais utiliser la clé `service_role` dans un composant client.
