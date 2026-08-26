import os
import json

centers = [
    {"name": "Centre de formation Talent D'or football club", "id": "talent-dor-fc", "desc": "École de football, formation, discipline, travail, succès, Sport et Études."},
    {"name": "Centre de Formation Professionnelle Regine-Norah", "id": "cfp-regine-norah", "desc": "Centre de Formation Professionnelle d'Excellence à Yaoundé."},
    {"name": "Centre de Formation d'Agriculture de Yaoundé", "id": "cf-agriculture-yaounde", "desc": "Formation spécialisée en agriculture et élevage au Cameroun."},
    {"name": "Centre de Formation Professionel Lead Vocational Training Center", "id": "lead-vocational-center", "desc": "Expert IT training for career success. Rejoignez-nous pour exceller !"},
    {"name": "Centre de Formation professionnelle SCAN&SNAP", "id": "scan-snap-formation", "desc": "Transformez votre potentiel avec des formations innovantes pour booster votre carrière."},
    {"name": "Centre De Formation JPNIL", "id": "jpnil-formation", "desc": "Joyeux de l'excellence en matière de beauté. Institut Saphir, Odza, Yaoundé."},
    {"name": "Centre de santé Saint Mathis", "id": "saint-mathis-sante", "desc": "Consultations générales et formations spécialisées à Ekie Amadou, Yaoundé."},
    {"name": "Centre Multifonctionnel De Promotion Des Jeunes De Yaoundé 3", "id": "cmpj-yaounde3", "desc": "Offre adéquate de services d'encadrement de la jeunesse extra-scolaire."},
    {"name": "Centre de Formation TELEC", "id": "telec-formation", "desc": "Étudier à l'étranger et obtenir son Diplôme Professionnel en 1 an. Essos, Yaoundé."},
    {"name": "Centre de Formation FCM", "id": "fcm-formation", "desc": "Acquisition de compétences permettant une insertion professionnelle rapide. Ngoa Ekele, Yaoundé."}
]

html_template = """<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{name}</title>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; color: #333; line-height: 1.6; }}
        header {{ background-color: #004d99; color: #fff; padding: 2rem 0; text-align: center; }}
        header h1 {{ margin: 0; font-size: 2.5rem; }}
        .container {{ max-width: 900px; margin: 2rem auto; padding: 0 2rem; text-align: center; }}
        .desc {{ font-size: 1.2rem; margin-bottom: 2rem; color: #555; }}
        .contact-btn {{ display: inline-block; background: #ff9900; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; }}
        footer {{ text-align: center; padding: 1rem 0; background: #f4f4f4; margin-top: 4rem; font-size: 0.9rem; }}
    </style>
</head>
<body>
    <header>
        <h1>{name}</h1>
    </header>
    <div class="container">
        <h2>Bienvenue sur notre site officiel</h2>
        <p class="desc">{desc}</p>
        <p>Nous sommes basés à Yaoundé, Cameroun.</p>
        <br>
        <a href="#" class="contact-btn">Nous contacter</a>
    </div>
    <footer>
        <p>&copy; 2024 {name} - Yaoundé, Cameroun.</p>
    </footer>
</body>
</html>
"""

base_dir = "websites"
os.makedirs(base_dir, exist_ok=True)

for center in centers:
    center_dir = os.path.join(base_dir, center["id"])
    os.makedirs(center_dir, exist_ok=True)
    
    # Write index.html
    html_content = html_template.format(name=center["name"], desc=center["desc"])
    with open(os.path.join(center_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(html_content)
    
    # Write simple firebase.json for hosting
    firebase_json = {
      "hosting": {
        "public": ".",
        "ignore": [
          "firebase.json",
          "**/.*",
          "**/node_modules/**"
        ]
      }
    }
    with open(os.path.join(center_dir, "firebase.json"), "w", encoding="utf-8") as f:
        json.dump(firebase_json, f, indent=2)

print("Websites generated successfully.")
