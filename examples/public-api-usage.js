/**
 * Exemple d'utilisation de l'API publique Serre Chevalier Parapente
 * 
 * Ce fichier montre comment utiliser les endpoints publics de l'API
 * avec la clé d'authentification requise.
 */

// Configuration
const API_BASE_URL = 'https://votre-domaine.com/api';
const API_KEY = '09b29417b57cf17d26bd0313a967cb79b8f55d3b05677084f8f31d75b49851e6';

// Headers communs pour toutes les requêtes
const commonHeaders = {
  'x-api-key': API_KEY,
  'Content-Type': 'application/json'
};

/**
 * Classe pour interagir avec l'API publique
 */
class SerreChevaliereAPI {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl;
    this.headers = {
      'x-api-key': apiKey,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Récupère tous les créneaux baptême disponibles
   * @param {Object} filters - Filtres optionnels
   * @param {string} filters.moniteurId - ID du moniteur
   * @param {string} filters.date - Date au format ISO (YYYY-MM-DD)
   * @returns {Promise<Object>} Réponse de l'API
   */
  async getBaptemeSlots(filters = {}) {
    const params = new URLSearchParams();
    if (filters.moniteurId) params.append('moniteurId', filters.moniteurId);
    if (filters.date) params.append('date', filters.date);

    const url = `${this.baseUrl}/biplaces/getAll${params.toString() ? '?' + params.toString() : ''}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des créneaux baptême:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau client
   * @param {Object} customerData - Données du client
   * @returns {Promise<Object>} Réponse de l'API
   */
  async createCustomer(customerData) {
    const url = `${this.baseUrl}/customers/create`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(customerData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la création du client:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les stages disponibles
   * @param {Object} filters - Filtres optionnels
   * @param {string} filters.moniteurId - ID du moniteur
   * @param {string} filters.date - Date de début au format ISO
   * @returns {Promise<Object>} Réponse de l'API
   */
  async getStages(filters = {}) {
    const params = new URLSearchParams();
    if (filters.moniteurId) params.append('moniteurId', filters.moniteurId);
    if (filters.date) params.append('date', filters.date);

    const url = `${this.baseUrl}/stages/getAll${params.toString() ? '?' + params.toString() : ''}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des stages:', error);
      throw error;
    }
  }
}

// Exemples d'utilisation
async function exemples() {
  const api = new SerreChevaliereAPI(API_BASE_URL, API_KEY);

  try {
    // 1. Récupérer tous les créneaux baptême
    console.log('=== Récupération des créneaux baptême ===');
    const baptemeSlots = await api.getBaptemeSlots();
    console.log('Créneaux disponibles:', baptemeSlots);

    // 2. Récupérer les créneaux pour une date spécifique
    console.log('\n=== Créneaux pour le 2024-06-15 ===');
    const slotsForDate = await api.getBaptemeSlots({ date: '2024-06-15' });
    console.log('Créneaux pour le 15 juin:', slotsForDate);

    // 3. Créer un nouveau client
    console.log('\n=== Création d\'un nouveau client ===');
    const newCustomer = await api.createCustomer({
      firstname: 'Marie',
      lastname: 'Martin',
      email: 'marie.martin@email.com',
      phone: '+33987654321',
      adress: '456 Avenue des Alpes',
      postalCode: '05240',
      city: 'La Salle-les-Alpes',
      country: 'France',
      height: 165,
      weight: 60
    });
    console.log('Client créé:', newCustomer);

    // 4. Récupérer tous les stages
    console.log('\n=== Récupération des stages ===');
    const stages = await api.getStages();
    console.log('Stages disponibles:', stages);

  } catch (error) {
    console.error('Erreur dans les exemples:', error);
  }
}

// Exemple avec gestion d'erreurs avancée
async function exempleAvecGestionErreurs() {
  const api = new SerreChevaliereAPI(API_BASE_URL, API_KEY);

  try {
    const result = await api.getBaptemeSlots();
    
    if (result.success) {
      console.log('Données récupérées avec succès:', result.data);
    } else {
      console.error('Erreur API:', result.message);
    }
  } catch (error) {
    if (error.message.includes('401')) {
      console.error('Erreur d\'authentification: Vérifiez votre clé API');
    } else if (error.message.includes('500')) {
      console.error('Erreur serveur: Réessayez plus tard');
    } else {
      console.error('Erreur réseau:', error.message);
    }
  }
}

// Exporter la classe pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SerreChevaliereAPI;
}

// Exécuter les exemples si ce fichier est exécuté directement
if (typeof require !== 'undefined' && require.main === module) {
  exemples();
}