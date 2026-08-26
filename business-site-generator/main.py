import json
import os
import re
from pathlib import Path
import requests
from google import genai
from dotenv import load_dotenv

load_dotenv()

PLACES_API_KEY = os.environ.get("GOOGLE_MAPS_API_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"

def search_businesses(query, location):
    if not PLACES_API_KEY or "votre_cle" in PLACES_API_KEY:
        print("Erreur: Clé Google Maps API manquante dans le fichier .env")
        return []

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": PLACES_API_KEY,
        "X-Goog-FieldMask": (
            "places.id,places.displayName,places.formattedAddress,"
            "places.nationalPhoneNumber,places.internationalPhoneNumber,"
            "places.websiteUri,places.googleMapsUri,places.primaryType,"
            "places.regularOpeningHours,places.photos"
        ),
    }
    body = {
        "textQuery": f"{query} à {location}",
        "languageCode": "fr",
        "pageSize": 20,
    }
    try:
        response = requests.post(SEARCH_URL, headers=headers, json=body, timeout=30)
        response.raise_for_status()
        return response.json().get("places", [])
    except Exception as e:
        print(f"Erreur lors de la recherche: {e}")
        return []

def normalize_business(place):
    display_name = place.get("displayName", {})
    return {
        "id": place.get("id"),
        "name": display_name.get("text", "Entreprise Sans Nom"),
        "address": place.get("formattedAddress"),
        "phone": place.get("internationalPhoneNumber") or place.get("nationalPhoneNumber"),
        "category": place.get("primaryType"),
        "website": place.get("websiteUri"),
        "google_maps": place.get("googleMapsUri"),
        "opening_hours": place.get("regularOpeningHours", {}),
    }

def has_official_website(business):
    website = business.get("website")
    if not website:
        return False
    excluded_domains = [
        "facebook.com", "instagram.com", "tiktok.com", 
        "linkedin.com", "google.com", "maps.google.com"
    ]
    return not any(domain in website.lower() for domain in excluded_domains)

def collect_without_website(query, location):
    print(f"Recherche de '{query}' à '{location}'...")
    places = search_businesses(query, location)
    businesses = [normalize_business(p) for p in places]
    
    without_website = [b for b in businesses if not has_official_website(b)]
    
    Path("data").mkdir(exist_ok=True)
    Path("data/businesses.json").write_text(
        json.dumps(without_website, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
    return without_website

def generate_site(business):
    if not GEMINI_API_KEY or "votre_cle" in GEMINI_API_KEY:
        print("Erreur: Clé Gemini API manquante dans le fichier .env")
        return None

    print(f"Génération du site pour {business['name']}...")
    client = genai.Client(api_key=GEMINI_API_KEY)
    
    prompt = f"""
Tu es un développeur web professionnel. Crée un site vitrine responsive en français pour cette entreprise :
{json.dumps(business, ensure_ascii=False, indent=2)}

Contraintes :
- produire un site statique moderne (HTML/CSS/JS) ;
- générer index.html, styles.css et script.js ;
- ne pas inventer de prix, certifications, avis ou horaires ;
- utiliser uniquement les informations fournies pour le nom et l'adresse ;
- IMPORTANT : Pour les boutons de contact, tu DOIS utiliser ces informations exactes de contact pour la démonstration :
  - Téléphone (bouton Appeler) : utiliser le lien "tel:+237690891052" et afficher "690891052".
  - WhatsApp (bouton WhatsApp) : utiliser le lien "https://wa.me/237683054990" et afficher "WhatsApp: 683054990".
- prévoir un bouton pour voir l'itinéraire (google_maps) ;
- ajouter un emplacement pour le logo;
- retourner UNIQUEMENT un JSON valide sous cette forme sans aucun bloc markdown autour (pas de ```json) :
{{
  "index.html": "...",
  "styles.css": "...",
  "script.js": "..."
}}
"""
    try:
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
        )
        text = response.text.strip()
        text = re.sub(r"^```json\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        return json.loads(text)
    except Exception as e:
        print(f"Erreur lors de la génération: {e}")
        return None

def save_site(business, files):
    if not files:
        return None
    safe_name = re.sub(r"[^a-z0-9-]+", "-", business["name"].lower()).strip("-")
    if not safe_name:
        safe_name = "entreprise-inconnue"
        
    destination = Path("generated") / safe_name
    destination.mkdir(parents=True, exist_ok=True)
    
    for filename, content in files.items():
        (destination / filename).write_text(content, encoding="utf-8")
    return destination

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Générateur de sites automatisé")
    parser.add_argument("--mode", choices=["collect", "generate"], default="collect", 
                        help="Mode d'exécution : collecter des données ou générer des sites")
    parser.add_argument("--query", default="restaurants", help="Type d'entreprise")
    parser.add_argument("--location", default="Yaoundé, Cameroun", help="Lieu de recherche")
    
    args = parser.parse_args()
    
    if args.mode == "collect":
        businesses = collect_without_website(args.query, args.location)
        print(f"[OK] {len(businesses)} entreprise(s) sans site declare trouvee(s).")
    
    elif args.mode == "generate":
        data_file = Path("data/businesses.json")
        if not data_file.exists():
            print("[Erreur] Aucune donnee trouvee. Executez le mode 'collect' d'abord.")
            return
            
        businesses = json.loads(data_file.read_text(encoding="utf-8"))
        for business in businesses:
            safe_name = re.sub(r"[^a-z0-9-]+", "-", business["name"].lower()).strip("-")
            folder_path = Path("generated") / safe_name
            if folder_path.exists():
                print(f"[SKIP] Site deja genere pour {business['name']} ({folder_path})")
                continue
                
            files = generate_site(business)
            if files:
                folder = save_site(business, files)
                print(f"[OK] Site genere dans : {folder}")

if __name__ == "__main__":
    main()
