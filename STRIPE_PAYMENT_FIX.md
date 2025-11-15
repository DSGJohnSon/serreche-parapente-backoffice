# Fix: Format invalide du clientSecret Stripe lors du paiement

## Problème identifié

Le frontend recevait un `clientSecret` au format invalide : `"pi_test_1763211920554_secret_test"` au lieu du format attendu par Stripe : `"pi_xxx_secret_yyy"`.

### Cause racine

L'application fonctionnait en **mode test** (sans clé API Stripe configurée), et la fonction [`createPaymentIntent()`](src/lib/stripe.ts:12) générait un `client_secret` avec un format incorrect :

```typescript
// ❌ AVANT (format invalide)
client_secret: `pi_test_${Date.now()}_secret_test`
// Résultat: "pi_test_1763211920554_secret_test"
```

Stripe rejette ce format car la partie après `_secret_` doit être une chaîne aléatoire longue, pas juste "test".

## Solution appliquée

### 1. Correction du format du clientSecret en mode test

**Fichier modifié:** [`src/lib/stripe.ts`](src/lib/stripe.ts)

```typescript
// ✅ APRÈS (format valide)
const timestamp = Date.now();
const randomSecret = Math.random().toString(36).substring(2, 15) + 
                     Math.random().toString(36).substring(2, 15);
return {
  id: `pi_test_${timestamp}`,
  client_secret: `pi_test_${timestamp}_secret_${randomSecret}`,
  amount: Math.round(order.totalAmount * 100),
};
// Résultat: "pi_test_1763211920554_secret_a7b3c9d2e5f8g1h4"
```

Cette modification a été appliquée aux deux fonctions :
- [`createPaymentIntent()`](src/lib/stripe.ts:12)
- [`createPaymentWithIdempotency()`](src/lib/stripe.ts:73)

### 2. Amélioration de la structure de réponse

**Fichier modifié:** [`src/features/orders/server/route.ts`](src/features/orders/server/route.ts:232)

La réponse JSON retournée par `POST /api/orders/create` a été optimisée pour correspondre exactement aux attentes du frontend :

```typescript
{
  success: true,
  message: "Commande créée avec succès",
  data: {
    order: {
      id: "uuid-de-la-commande",
      orderNumber: "ORD-2024-001",
      totalAmount: 150.00,
      customerEmail: "client@example.com",
      status: "PENDING",
      createdAt: "2024-01-15T10:30:00Z"
    },
    paymentIntent: {
      id: "pi_test_1763211920554",
      clientSecret: "pi_test_1763211920554_secret_a7b3c9d2e5f8g1h4",
      amount: 15000  // en centimes
    }
  }
}
```

### 3. Ajout de logs pour le débogage

Des logs ont été ajoutés pour faciliter le diagnostic en cas de problème :

```typescript
console.log('PaymentIntent créé:', {
  id: paymentIntent.id,
  hasClientSecret: !!paymentIntent.client_secret,
  clientSecretFormat: paymentIntent.client_secret?.substring(0, 20) + '...',
  amount: paymentIntent.amount,
});
```

## Configuration Stripe pour la production

### Mode Test (actuel)

L'application fonctionne actuellement **sans clé Stripe** et génère des PaymentIntents de test. C'est suffisant pour le développement mais ne permet pas de vrais paiements.

### Mode Production

Pour activer les vrais paiements Stripe, ajoutez dans le fichier [`.env`](.env) :

```env
# Clé secrète Stripe (mode test)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx

# OU pour la production
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
```

**Où trouver votre clé Stripe :**
1. Connectez-vous à [dashboard.stripe.com](https://dashboard.stripe.com)
2. Allez dans **Developers** → **API keys**
3. Copiez la **Secret key** (commence par `sk_test_` ou `sk_live_`)

⚠️ **IMPORTANT :** Ne commitez JAMAIS votre clé secrète Stripe dans Git !

## Flux de paiement complet

### 1. Création de commande (`POST /api/orders/create`)

**Frontend envoie :**
```json
{
  "customerEmail": "client@example.com",
  "appliedGiftCardCodes": ["SCP-XXXXX-XXXX"],
  "customerData": {
    "firstName": "Jean",
    "lastName": "Dupont",
    "phone": "+33612345678",
    "address": "123 rue Example",
    "postalCode": "75001",
    "city": "Paris",
    "country": "France"
  }
}
```

**Backend répond :**
```json
{
  "success": true,
  "data": {
    "order": { "id": "...", "orderNumber": "..." },
    "paymentIntent": { 
      "id": "pi_xxx",
      "clientSecret": "pi_xxx_secret_yyy" 
    }
  }
}
```

### 2. Redirection vers la page de paiement

Le frontend redirige vers :
```
/checkout/payment?order={order.id}&client_secret={clientSecret}
```

### 3. Initialisation de Stripe Elements

La page de paiement utilise le `clientSecret` pour initialiser le formulaire Stripe :
```typescript
const stripe = await loadStripe(publishableKey);
const elements = stripe.elements({ clientSecret });
```

### 4. Confirmation du paiement

L'utilisateur remplit le formulaire et confirme le paiement via Stripe.

## Vérifications effectuées

✅ Le `clientSecret` est généré au format valide : `pi_xxx_secret_yyy`  
✅ Le backend retourne le `clientSecret` dans la réponse JSON  
✅ La structure de réponse correspond aux attentes du frontend  
✅ Le montant est correctement converti en centimes (× 100)  
✅ Les logs permettent de déboguer facilement  
✅ La gestion d'erreur retourne un status HTTP 500 approprié  

## Tests recommandés

### Test en mode développement (sans Stripe)

1. Créer une commande via le frontend
2. Vérifier dans les logs du backend :
   ```
   PaymentIntent créé: {
     id: 'pi_test_...',
     hasClientSecret: true,
     clientSecretFormat: 'pi_test_..._secret_...',
     amount: 15000
   }
   ```
3. Vérifier que la redirection fonctionne vers `/checkout/payment`
4. Le formulaire Stripe devrait s'afficher (même en mode test)

### Test avec Stripe (mode test)

1. Ajouter `STRIPE_SECRET_KEY=sk_test_...` dans `.env`
2. Redémarrer le serveur
3. Créer une commande
4. Utiliser une carte de test Stripe : `4242 4242 4242 4242`
5. Le paiement devrait être traité par Stripe

### Cartes de test Stripe

- **Succès :** `4242 4242 4242 4242`
- **Refusée :** `4000 0000 0000 0002`
- **Authentification requise :** `4000 0025 0000 3155`

Date d'expiration : n'importe quelle date future  
CVC : n'importe quel 3 chiffres  
Code postal : n'importe quel code valide

## Résumé des modifications

| Fichier | Lignes modifiées | Description |
|---------|------------------|-------------|
| [`src/lib/stripe.ts`](src/lib/stripe.ts) | 12-37, 73-102 | Correction du format `client_secret` en mode test |
| [`src/features/orders/server/route.ts`](src/features/orders/server/route.ts) | 207-223, 232-245, 247-256 | Amélioration de la réponse JSON et ajout de logs |

## Support

Si le problème persiste :

1. Vérifier les logs du backend lors de la création de commande
2. Vérifier que le `clientSecret` reçu par le frontend est au bon format
3. Vérifier la console du navigateur pour les erreurs Stripe
4. S'assurer que la clé publique Stripe (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`) est configurée dans le frontend

---

**Date de résolution :** 2025-01-15  
**Version :** 1.0.0