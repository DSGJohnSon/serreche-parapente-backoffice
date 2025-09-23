# API Publique - Documentation

## Configuration

### Variables d'environnement

Ajoutez cette variable à votre fichier `.env` :

```env
PUBLIC_API_KEY=09b29417b57cf17d26bd0313a967cb79b8f55d3b05677084f8f31d75b49851e6
```

> **Note de sécurité :** Cette clé doit être gardée secrète et ne jamais être exposée côté client.

## Endpoints API Publiques

Les endpoints suivants nécessitent l'authentification par clé API :

### 1. Récupération des créneaux baptême

**Endpoint :** `GET /api/biplaces/getAll`

**Headers requis :**
```
x-api-key: 09b29417b57cf17d26bd0313a967cb79b8f55d3b05677084f8f31d75b49851e6
```

**Paramètres de requête optionnels :**
- `moniteurId` : Filtrer par ID du moniteur
- `date` : Filtrer par date (format ISO)

**Exemple de requête :**
```bash
curl -X GET "https://votre-domaine.com/api/biplaces/getAll?date=2024-01-15" \
  -H "x-api-key: 09b29417b57cf17d26bd0313a967cb79b8f55d3b05677084f8f31d75b49851e6"
```

### 2. Création de clients

**Endpoint :** `POST /api/customers/create`

**Headers requis :**
```
x-api-key: 09b29417b57cf17d26bd0313a967cb79b8f55d3b05677084f8f31d75b49851e6
Content-Type: application/json
```

**Corps de la requête :**
```json
{
  "firstname": "Jean",
  "lastname": "Dupont",
  "email": "jean.dupont@email.com",
  "phone": "+33123456789",
  "adress": "123 Rue de la Paix",
  "postalCode": "75001",
  "city": "Paris",
  "country": "France",
  "height": 175,
  "weight": 70
}
```

**Exemple de requête :**
```bash
curl -X POST "https://votre-domaine.com/api/customers/create" \
  -H "x-api-key: 09b29417b57cf17d26bd0313a967cb79b8f55d3b05677084f8f31d75b49851e6" \
  -H "Content-Type: application/json" \
  -d '{
    "firstname": "Jean",
    "lastname": "Dupont",
    "email": "jean.dupont@email.com",
    "phone": "+33123456789",
    "adress": "123 Rue de la Paix",
    "postalCode": "75001",
    "city": "Paris",
    "country": "France",
    "height": 175,
    "weight": 70
  }'
```

### 3. Récupération des stages

**Endpoint :** `GET /api/stages/getAll`

**Headers requis :**
```
x-api-key: 09b29417b57cf17d26bd0313a967cb79b8f55d3b05677084f8f31d75b49851e6
```

**Paramètres de requête optionnels :**
- `moniteurId` : Filtrer par ID du moniteur
- `date` : Filtrer par date de début (format ISO)

**Exemple de requête :**
```bash
curl -X GET "https://votre-domaine.com/api/stages/getAll?moniteurId=123" \
  -H "x-api-key: 09b29417b57cf17d26bd0313a967cb79b8f55d3b05677084f8f31d75b49851e6"
```

## Réponses API

Toutes les réponses suivent le format suivant :

```json
{
  "success": true,
  "message": "Message descriptif",
  "data": { /* données de réponse */ }
}
```

En cas d'erreur :

```json
{
  "success": false,
  "message": "Description de l'erreur",
  "data": null
}
```

## Codes d'erreur

- `401 Unauthorized` : Clé API manquante ou invalide
- `400 Bad Request` : Données de requête invalides
- `500 Internal Server Error` : Erreur serveur

## Sécurité

- La clé API doit être transmise via le header `x-api-key`
- Gardez votre clé API secrète et ne l'exposez jamais côté client
- Utilisez HTTPS pour toutes les requêtes
- Régénérez la clé API régulièrement pour maintenir la sécurité

## Génération d'une nouvelle clé API

Pour générer une nouvelle clé API sécurisée :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Puis mettez à jour la variable d'environnement `PUBLIC_API_KEY` avec la nouvelle valeur.