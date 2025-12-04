# Configuration des Emails de Confirmation

Ce document explique comment configurer et utiliser le système d'envoi d'emails de confirmation après un paiement réussi via Stripe.

## 📋 Vue d'ensemble

Après chaque paiement réussi via Stripe, un email de confirmation est automatiquement envoyé au client avec :
- Le récapitulatif de la commande
- Les détails des réservations (stages, baptêmes, cartes cadeaux)
- Le montant payé et les soldes restants
- Les prochaines étapes
- Les informations de contact

## 🔧 Configuration

### 1. Compte Resend

1. Créez un compte sur [Resend](https://resend.com)
2. Obtenez votre clé API dans les paramètres
3. Ajoutez la clé API dans votre fichier `.env` :

```env
RESEND_API_KEY="re_votre_cle_api"
```

### 2. Configuration du domaine (Production)

Pour envoyer des emails en production avec votre propre domaine :

1. Allez sur [Resend Domains](https://resend.com/domains)
2. Ajoutez votre domaine (ex: `stage-de-parapente.fr`)
3. Configurez les enregistrements DNS selon les instructions de Resend
4. Attendez la vérification du domaine
5. Ajoutez l'email d'expéditeur dans `.env` :

```env
RESEND_FROM_EMAIL="Serre Chevalier Parapente <noreply@stage-de-parapente.fr>"
```

### 3. Mode Test

En mode test (sans domaine vérifié), Resend ne peut envoyer des emails qu'à l'adresse email du propriétaire du compte.

Pour tester :
```bash
pnpm test:email
```

⚠️ **Important** : Modifiez l'email dans `src/scripts/test-email.ts` pour utiliser l'email de votre compte Resend.

## 📧 Template d'Email

Le template d'email est basé sur React Email et se trouve dans :
- **Template** : [`src/emails/order-confirmation.tsx`](../src/emails/order-confirmation.tsx)
- **Fonction d'envoi** : [`src/lib/resend.ts`](../src/lib/resend.ts)

### Personnalisation du Template

Pour modifier le contenu ou le style de l'email, éditez le fichier [`src/emails/order-confirmation.tsx`](../src/emails/order-confirmation.tsx).

Le template inclut :
- ✅ Header avec confirmation de réservation
- 📋 Informations de commande et client
- 🎯 Détail des réservations
- 💰 Récapitulatif des paiements (payé + soldes)
- 📅 Prochaines étapes
- 📞 Informations de contact

## 🔄 Intégration avec Stripe Webhook

L'envoi d'email est automatiquement déclenché dans le webhook Stripe après un paiement réussi :

**Fichier** : [`src/app/api/webhooks/stripe/route.ts`](../src/app/api/webhooks/stripe/route.ts)

```typescript
// Après la confirmation de la commande
await sendOrderConfirmationEmail(emailData);
```

### Gestion des Erreurs

Si l'envoi d'email échoue, l'erreur est loggée mais **ne bloque pas** le traitement du paiement. Cela garantit que :
- Le paiement est toujours traité correctement
- La commande est confirmée
- Les réservations sont créées
- Seul l'email n'est pas envoyé (peut être renvoyé manuellement si nécessaire)

## 🧪 Tests

### Test Manuel

Pour tester l'envoi d'email avec des données fictives :

```bash
pnpm test:email
```

Ce script envoie un email de test avec :
- Une commande fictive
- Un stage et un baptême
- Des paiements et soldes

### Test avec une Vraie Commande

Pour tester avec une vraie commande Stripe :

1. Effectuez un paiement test via Stripe
2. Vérifiez les logs du webhook dans la console
3. Vérifiez la réception de l'email

## 📊 Données de l'Email

Les données envoyées dans l'email incluent :

```typescript
{
  orderNumber: string;        // Numéro de commande
  orderDate: string;          // Date de la commande
  customerEmail: string;      // Email du client
  customerName: string;       // Nom complet du client
  customerPhone: string;      // Téléphone du client
  orderItems: OrderItem[];    // Articles de la commande
  depositTotal: number;       // Total des acomptes payés
  remainingTotal: number;     // Total des soldes restants
  totalAmount: number;        // Montant total de la commande
  discountAmount: number;     // Réduction appliquée (cartes cadeaux)
  futurePayments: Payment[];  // Détails des paiements futurs
}
```

## 🚀 Déploiement

### Variables d'Environnement

Assurez-vous que ces variables sont configurées en production :

```env
RESEND_API_KEY="re_votre_cle_api_production"
RESEND_FROM_EMAIL="Serre Chevalier Parapente <noreply@stage-de-parapente.fr>"
```

### Vérification Post-Déploiement

1. Effectuez un paiement test en production
2. Vérifiez les logs du webhook
3. Confirmez la réception de l'email
4. Vérifiez que l'email s'affiche correctement sur mobile et desktop

## 📝 Logs

Les logs d'envoi d'email sont préfixés par `[RESEND]` :

```
[RESEND] 📧 Sending order confirmation email to client@example.com
[RESEND] ✅ Email sent successfully. ID: 024b4194-6c2e-43c8-8052-db079fcb7634
```

En cas d'erreur :

```
[RESEND] ❌ Error sending email: { statusCode: 403, message: '...' }
[RESEND] ❌ Failed to send email: ...
```

## 🔍 Dépannage

### L'email n'est pas reçu

1. Vérifiez les logs du webhook pour confirmer l'envoi
2. Vérifiez le dossier spam/courrier indésirable
3. Vérifiez que le domaine est vérifié dans Resend (production)
4. Vérifiez que l'email du destinataire est correct

### Erreur "Domain not verified"

- En mode test : utilisez `onboarding@resend.dev` comme expéditeur
- En production : vérifiez votre domaine sur Resend

### Erreur "Can only send to your own email"

- Vous êtes en mode test Resend
- Vérifiez un domaine pour envoyer à n'importe quelle adresse

## 📚 Ressources

- [Documentation Resend](https://resend.com/docs)
- [React Email Documentation](https://react.email/docs)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

## 🎨 Aperçu de l'Email

L'email de confirmation ressemble à la page de succès du frontend et inclut :

- 🎉 Header de confirmation avec icône de succès
- 📋 Numéro de commande et statut
- 👤 Informations client
- 🎯 Liste détaillée des réservations
- 💰 Récapitulatif des paiements avec acomptes et soldes
- 📅 Prochaines étapes (confirmation, contact, rappels)
- 📞 Informations de contact

Le design est responsive et s'adapte aux clients email (Gmail, Outlook, etc.).