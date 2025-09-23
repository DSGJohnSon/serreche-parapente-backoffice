"""
Exemple d'utilisation de l'API publique Serre Chevalier Parapente en Python

Ce fichier montre comment utiliser les endpoints publics de l'API
avec la clé d'authentification requise.
"""

import requests
import json
from datetime import datetime
from typing import Optional, Dict, Any

# Configuration
API_BASE_URL = 'https://votre-domaine.com/api'
API_KEY = '09b29417b57cf17d26bd0313a967cb79b8f55d3b05677084f8f31d75b49851e6'


class SerreChevaliereAPI:
    """Classe pour interagir avec l'API publique Serre Chevalier Parapente"""
    
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url
        self.headers = {
            'x-api-key': api_key,
            'Content-Type': 'application/json'
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)
    
    def _make_request(self, method: str, endpoint: str, params: Optional[Dict] = None, data: Optional[Dict] = None) -> Dict[str, Any]:
        """Effectue une requête HTTP avec gestion d'erreurs"""
        url = f"{self.base_url}/{endpoint}"
        
        try:
            response = self.session.request(
                method=method,
                url=url,
                params=params,
                json=data,
                timeout=30
            )
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.HTTPError as e:
            if response.status_code == 401:
                raise Exception("Erreur d'authentification: Vérifiez votre clé API")
            elif response.status_code == 500:
                raise Exception("Erreur serveur: Réessayez plus tard")
            else:
                raise Exception(f"Erreur HTTP {response.status_code}: {e}")
        except requests.exceptions.RequestException as e:
            raise Exception(f"Erreur réseau: {e}")
    
    def get_bapteme_slots(self, moniteur_id: Optional[str] = None, date: Optional[str] = None) -> Dict[str, Any]:
        """
        Récupère tous les créneaux baptême disponibles
        
        Args:
            moniteur_id: ID du moniteur (optionnel)
            date: Date au format ISO YYYY-MM-DD (optionnel)
            
        Returns:
            Réponse de l'API avec les créneaux disponibles
        """
        params = {}
        if moniteur_id:
            params['moniteurId'] = moniteur_id
        if date:
            params['date'] = date
            
        return self._make_request('GET', 'biplaces/getAll', params=params)
    
    def create_customer(self, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Crée un nouveau client
        
        Args:
            customer_data: Dictionnaire contenant les données du client
            
        Returns:
            Réponse de l'API avec les informations du client créé
        """
        required_fields = [
            'firstname', 'lastname', 'email', 'phone', 'adress',
            'postalCode', 'city', 'country', 'height', 'weight'
        ]
        
        # Vérifier que tous les champs requis sont présents
        missing_fields = [field for field in required_fields if field not in customer_data]
        if missing_fields:
            raise ValueError(f"Champs manquants: {', '.join(missing_fields)}")
        
        return self._make_request('POST', 'customers/create', data=customer_data)
    
    def get_stages(self, moniteur_id: Optional[str] = None, date: Optional[str] = None) -> Dict[str, Any]:
        """
        Récupère tous les stages disponibles
        
        Args:
            moniteur_id: ID du moniteur (optionnel)
            date: Date de début au format ISO YYYY-MM-DD (optionnel)
            
        Returns:
            Réponse de l'API avec les stages disponibles
        """
        params = {}
        if moniteur_id:
            params['moniteurId'] = moniteur_id
        if date:
            params['date'] = date
            
        return self._make_request('GET', 'stages/getAll', params=params)


def exemples():
    """Exemples d'utilisation de l'API"""
    api = SerreChevaliereAPI(API_BASE_URL, API_KEY)
    
    try:
        # 1. Récupérer tous les créneaux baptême
        print("=== Récupération des créneaux baptême ===")
        bapteme_slots = api.get_bapteme_slots()
        print(f"Créneaux disponibles: {json.dumps(bapteme_slots, indent=2, ensure_ascii=False)}")
        
        # 2. Récupérer les créneaux pour une date spécifique
        print("\n=== Créneaux pour le 2024-06-15 ===")
        slots_for_date = api.get_bapteme_slots(date='2024-06-15')
        print(f"Créneaux pour le 15 juin: {json.dumps(slots_for_date, indent=2, ensure_ascii=False)}")
        
        # 3. Créer un nouveau client
        print("\n=== Création d'un nouveau client ===")
        customer_data = {
            'firstname': 'Pierre',
            'lastname': 'Dubois',
            'email': 'pierre.dubois@email.com',
            'phone': '+33123456789',
            'adress': '789 Route de la Montagne',
            'postalCode': '05240',
            'city': 'La Salle-les-Alpes',
            'country': 'France',
            'height': 180,
            'weight': 75
        }
        
        new_customer = api.create_customer(customer_data)
        print(f"Client créé: {json.dumps(new_customer, indent=2, ensure_ascii=False)}")
        
        # 4. Récupérer tous les stages
        print("\n=== Récupération des stages ===")
        stages = api.get_stages()
        print(f"Stages disponibles: {json.dumps(stages, indent=2, ensure_ascii=False)}")
        
    except Exception as error:
        print(f"Erreur dans les exemples: {error}")


def exemple_avec_gestion_erreurs():
    """Exemple avec gestion d'erreurs avancée"""
    api = SerreChevaliereAPI(API_BASE_URL, API_KEY)
    
    try:
        result = api.get_bapteme_slots()
        
        if result.get('success'):
            print(f"Données récupérées avec succès: {result.get('data')}")
        else:
            print(f"Erreur API: {result.get('message')}")
            
    except Exception as error:
        print(f"Erreur: {error}")


def exemple_filtrage_avance():
    """Exemple avec filtrage avancé des données"""
    api = SerreChevaliereAPI(API_BASE_URL, API_KEY)
    
    try:
        # Récupérer tous les créneaux
        result = api.get_bapteme_slots()
        
        if result.get('success') and result.get('data'):
            slots = result['data']
            
            # Filtrer les créneaux avec des places disponibles
            available_slots = [
                slot for slot in slots 
                if len(slot.get('bookings', [])) < slot.get('places', 0)
            ]
            
            print(f"Créneaux avec places disponibles: {len(available_slots)}")
            
            # Grouper par moniteur
            by_moniteur = {}
            for slot in available_slots:
                for moniteur_rel in slot.get('moniteurs', []):
                    moniteur = moniteur_rel.get('moniteur', {})
                    moniteur_name = moniteur.get('name', 'Inconnu')
                    
                    if moniteur_name not in by_moniteur:
                        by_moniteur[moniteur_name] = []
                    by_moniteur[moniteur_name].append(slot)
            
            print("Créneaux par moniteur:")
            for moniteur, slots in by_moniteur.items():
                print(f"  {moniteur}: {len(slots)} créneaux")
                
    except Exception as error:
        print(f"Erreur: {error}")


if __name__ == "__main__":
    print("=== Exemples d'utilisation de l'API Serre Chevalier Parapente ===\n")
    exemples()
    
    print("\n" + "="*60 + "\n")
    exemple_avec_gestion_erreurs()
    
    print("\n" + "="*60 + "\n")
    exemple_filtrage_avance()