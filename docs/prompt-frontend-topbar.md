# Contexte

Je fournis ici les instructions pour intégrer le bandeau promotionnel dynamique (TopBar) sur le site public NextJS. La partie BackOffice a été complétée et l'API est exposée.

# API

La route API publique pour récupérer l'état du bandeau est : `GET /api/content/topbar` sur l'URL de base de l'API (actuellement le même domaine que le backoffice).

## Réponse de l'API :

```json
{
  "success": true,
  "message": "",
  "data": {
    "id": "cuid_string",
    "isActive": true,
    "title": "Titre du bandeau",
    "secondaryText": "Sous-titre optionnel",
    "ctaTitle": "Titre du bouton",
    "ctaLink": "https://example.com",
    "ctaIsFull": true,
    "ctaIsExternal": false,
    "createdAt": "date_string",
    "updatedAt": "date_string"
  }
}
```

# Tâche à réaliser

Ton rôle est de créer un composant de rendu côté client (Client Component) ou côté serveur (Server Component si pertinent) sur le site React/NextJS qui va faire un appel `fetch` à cette route API _(sans oublier de gérer le cache ou ISR de manière la plus performante possible, par exemple un `revalidate` toutes les X minutes ou à chaque requête selon la stratégie choisie par le projet)._

## Critères d'affichage

1. Tu ne dois **RIEN afficher** si `isActive` est `false` ou si l'API retourne une erreur / `success: false`.
2. Le CTA global (`ctaIsFull: true`) implique que **tout le bandeau** est cliquable (balise `<a>` englobante ou `next/link`).
3. Si `ctaIsFull: false`, seul le texte du `ctaTitle` sera cliquable, textuellement à côté de `title` et `secondaryText` (voir la maquette).
4. Si `ctaIsExternal: true`, le lien devra s'ouvrir sur un nouvel onglet (`target="_blank" rel="noopener noreferrer"`).
5. Veiller à ce que l'affichage corresponde bien aux variables du JSON fourni.
