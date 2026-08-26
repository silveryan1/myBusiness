import os
import json

centers = [
    {
        "id": "talent-dor-fc", 
        "name": "Talent D'or FC", 
        "desc": "École de football de premier plan à Yaoundé. Nous allions sport et études pour garantir la réussite de nos jeunes talents.",
        "services": ["Formation de football", "Suivi scolaire", "Développement personnel", "Tournois locaux et internationaux"],
        "color": "#e63946", "bg": "https://images.unsplash.com/photo-1518605368461-1e1e1fd1d1f4?auto=format&fit=crop&q=80&w=1200",
        "fb": "https://web.facebook.com/profile.php?id=100064069780875"
    },
    {
        "id": "cfp-regine-norah", 
        "name": "CFP Regine Norah", 
        "desc": "Centre de Formation Professionnelle d'Excellence. Nous formons les leaders de demain avec des programmes adaptés au marché du travail.",
        "services": ["Formations certifiantes", "Ateliers pratiques", "Accompagnement à l'emploi", "Coaching professionnel"],
        "color": "#2a9d8f", "bg": "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=1200",
        "fb": "https://web.facebook.com/boutross97"
    },
    {
        "id": "cf-agriculture-yaounde", 
        "name": "CF Agriculture Yaoundé", 
        "desc": "Spécialistes de la formation en agriculture et élevage au Cameroun. Cultivez votre avenir avec nos experts.",
        "services": ["Techniques agricoles modernes", "Élevage durable", "Gestion d'exploitation", "Agriculture biologique"],
        "color": "#2b9348", "bg": "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=1200",
        "fb": "https://web.facebook.com/CFAYCFAM"
    },
    {
        "id": "lead-vocational-center", 
        "name": "Lead Vocational Center", 
        "desc": "Expert IT training for career success. Rejoignez-nous pour exceller dans le domaine des nouvelles technologies.",
        "services": ["Développement Web & Mobile", "Réseaux & Sécurité", "Maintenance informatique", "Bureautique avancée"],
        "color": "#0077b6", "bg": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=1200",
        "fb": "https://web.facebook.com/profile.php?id=61554873636143"
    },
    {
        "id": "scan-snap-formation", 
        "name": "SCAN&SNAP Formation", 
        "desc": "Transformez votre potentiel avec des formations innovantes pour booster votre carrière professionnelle.",
        "services": ["Management de projet", "Marketing digital", "Design & Création", "Leadership"],
        "color": "#9c6644", "bg": "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1200",
        "fb": "https://web.facebook.com/scanandsnap"
    },
    {
        "id": "jpnil-formation", 
        "name": "Centre De Formation JPNIL", 
        "desc": "Joyeux de l'excellence en matière de beauté. Retrouvez l'Institut Saphir à Odza, Yaoundé.",
        "services": ["Esthétique & Cosmétique", "Coiffure professionnelle", "Soins du visage", "Maquillage artistique"],
        "color": "#c9184a", "bg": "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1200",
        "fb": "https://web.facebook.com/centredeformationjpnil"
    },
    {
        "id": "saint-mathis-sante", 
        "name": "Centre de santé Saint Mathis", 
        "desc": "Consultations générales et formations spécialisées en santé. Votre bien-être est notre priorité à Ekie Amadou, Yaoundé.",
        "services": ["Soins infirmiers", "Premiers secours", "Nutrition & Diététique", "Accompagnement médical"],
        "color": "#023e8a", "bg": "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=1200",
        "fb": "https://web.facebook.com/profile.php?id=100051582497078"
    },
    {
        "id": "cmpj-yaounde3", 
        "name": "CMPJ Yaoundé 3", 
        "desc": "Offre adéquate de services d'encadrement de la jeunesse extra-scolaire. Donnons des ailes à vos projets.",
        "services": ["Activités socio-éducatives", "Soutien scolaire", "Animation culturelle", "Orientation professionnelle"],
        "color": "#f4a261", "bg": "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=1200",
        "fb": "https://web.facebook.com/madoundjell"
    },
    {
        "id": "telec-formation", 
        "name": "Centre de Formation TELEC", 
        "desc": "Étudier à l'étranger et obtenir son Diplôme Professionnel en 1 an. La clé de votre réussite internationale à Essos, Yaoundé.",
        "services": ["Préparation aux études à l'étranger", "Cours de langues", "Conseil en orientation", "Suivi de dossier"],
        "color": "#6a4c93", "bg": "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=1200",
        "fb": "https://web.facebook.com/profile.php?id=100066735220825"
    },
    {
        "id": "fcm-formation", 
        "name": "Centre de Formation FCM", 
        "desc": "Acquisition de compétences permettant une insertion professionnelle rapide. Situé au Château Ngoa Ekele, Yaoundé.",
        "services": ["Formation technique", "Ateliers métiers", "Stages en entreprise", "Aide à la recherche d'emploi"],
        "color": "#d62828", "bg": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1200",
        "fb": "https://web.facebook.com/profile.php?id=61585988693571"
    }
]

html_template = """<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{name} - Yaoundé</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        :root {{
            --primary: {color};
            --text-dark: #333;
            --text-light: #666;
            --bg-light: #f8f9fa;
        }}
        
        * {{ margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', system-ui, sans-serif; }}
        
        body {{ color: var(--text-dark); line-height: 1.6; }}
        
        /* Navbar */
        nav {{ display: flex; justify-content: space-between; padding: 1.5rem 5%; background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1); position: sticky; top: 0; z-index: 100; }}
        nav .logo {{ font-size: 1.5rem; font-weight: bold; color: var(--primary); }}
        nav ul {{ display: flex; list-style: none; gap: 2rem; align-items: center; }}
        nav a {{ text-decoration: none; color: var(--text-dark); font-weight: 500; transition: color 0.3s; }}
        nav a:hover {{ color: var(--primary); }}
        
        /* Hero Section */
        .hero {{ 
            height: 80vh; 
            background: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('{bg}') center/cover;
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            text-align: center; color: white; padding: 0 20px;
        }}
        .hero h1 {{ font-size: 3.5rem; margin-bottom: 1rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.5); }}
        .hero p {{ font-size: 1.2rem; max-width: 600px; margin-bottom: 2rem; }}
        .btn {{ padding: 12px 30px; background: var(--primary); color: white; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 1.1rem; transition: transform 0.3s, box-shadow 0.3s; display: inline-block; }}
        .btn:hover {{ transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.2); }}
        
        .fb-btn {{ background: #1877F2; margin-left: 10px; }}
        .fb-btn:hover {{ background: #0c64d4; }}
        
        /* Services Section */
        .services {{ padding: 5rem 5%; background: var(--bg-light); text-align: center; }}
        .section-title {{ font-size: 2.5rem; margin-bottom: 3rem; color: var(--text-dark); }}
        .services-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; }}
        .service-card {{ background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); transition: transform 0.3s; }}
        .service-card:hover {{ transform: translateY(-10px); }}
        .service-card i {{ font-size: 2.5rem; color: var(--primary); margin-bottom: 1rem; }}
        .service-card h3 {{ margin-bottom: 1rem; }}
        
        /* About Section */
        .about {{ padding: 5rem 5%; display: flex; align-items: center; gap: 4rem; flex-wrap: wrap; }}
        .about-text {{ flex: 1; min-width: 300px; }}
        .about-text h2 {{ font-size: 2.5rem; margin-bottom: 1.5rem; }}
        .about-image {{ flex: 1; min-width: 300px; height: 400px; background: url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800') center/cover; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }}
        
        /* Contact Section */
        .contact {{ padding: 5rem 5%; background: var(--text-dark); color: white; text-align: center; }}
        .contact-info {{ display: flex; justify-content: center; gap: 3rem; margin-top: 3rem; flex-wrap: wrap; }}
        .info-item i {{ font-size: 2rem; color: var(--primary); margin-bottom: 1rem; }}
        .info-item a {{ color: white; text-decoration: none; }}
        .info-item a:hover {{ color: var(--primary); }}
        
        /* Footer */
        footer {{ text-align: center; padding: 2rem; background: #1a1a1a; color: #888; }}
        
        @media (max-width: 768px) {{
            nav ul {{ display: none; }}
            .hero h1 {{ font-size: 2.5rem; }}
            .fb-btn {{ margin-left: 0; margin-top: 10px; display: block; }}
        }}
    </style>
</head>
<body>
    <nav>
        <div class="logo">{name}</div>
        <ul>
            <li><a href="#accueil">Accueil</a></li>
            <li><a href="#services">Formations</a></li>
            <li><a href="#propos">À Propos</a></li>
            <li><a href="#contact">Contact</a></li>
        </ul>
    </nav>

    <section id="accueil" class="hero">
        <h1>{name}</h1>
        <p>{desc}</p>
        <div>
            <a href="#contact" class="btn">Rejoignez-nous</a>
            <a href="{fb}" target="_blank" class="btn fb-btn"><i class="fab fa-facebook-f"></i> Visitez notre Page Facebook</a>
        </div>
    </section>

    <section id="services" class="services">
        <h2 class="section-title">Nos Domaines d'Expertise</h2>
        <div class="services-grid">
            <div class="service-card">
                <i class="fas fa-graduation-cap"></i>
                <h3>{s1}</h3>
                <p>Un programme complet conçu par des experts pour vous garantir les meilleures compétences.</p>
            </div>
            <div class="service-card">
                <i class="fas fa-users"></i>
                <h3>{s2}</h3>
                <p>Une approche personnalisée et un accompagnement de proximité tout au long de votre parcours.</p>
            </div>
            <div class="service-card">
                <i class="fas fa-chart-line"></i>
                <h3>{s3}</h3>
                <p>Des outils modernes et des méthodes innovantes pour maximiser votre potentiel.</p>
            </div>
            <div class="service-card">
                <i class="fas fa-award"></i>
                <h3>{s4}</h3>
                <p>Une certification reconnue et valorisée sur le marché du travail.</p>
            </div>
        </div>
    </section>

    <section id="propos" class="about">
        <div class="about-text">
            <h2>À Propos de Nous</h2>
            <p style="margin-bottom: 1rem;">Basé au cœur de <strong>Yaoundé</strong>, {name} s'engage à offrir une formation de haute qualité. Notre mission est d'accompagner la jeunesse et les professionnels vers l'excellence.</p>
            <p style="margin-bottom: 2rem;">Forts de notre expérience locale, nous adaptons constamment nos programmes pour répondre aux défis et aux exigences réelles du marché professionnel camerounais et international.</p>
            <ul style="list-style-type: none;">
                <li style="margin-bottom: 0.5rem;"><i class="fas fa-check" style="color: var(--primary); margin-right: 10px;"></i> Formateurs certifiés et expérimentés</li>
                <li style="margin-bottom: 0.5rem;"><i class="fas fa-check" style="color: var(--primary); margin-right: 10px;"></i> Cadre d'apprentissage moderne</li>
                <li style="margin-bottom: 0.5rem;"><i class="fas fa-check" style="color: var(--primary); margin-right: 10px;"></i> Réseau de partenaires entreprises</li>
            </ul>
        </div>
        <div class="about-image"></div>
    </section>

    <section id="contact" class="contact">
        <h2 class="section-title" style="color: white;">Contactez-Nous</h2>
        <p>Prêt à démarrer votre nouvelle carrière ? N'hésitez pas à nous joindre pour toute information ou inscription.</p>
        <div class="contact-info">
            <div class="info-item">
                <i class="fas fa-map-marker-alt"></i>
                <h3>Adresse</h3>
                <p>Yaoundé, Cameroun</p>
            </div>
            <div class="info-item">
                <i class="fas fa-envelope"></i>
                <h3>Email</h3>
                <p>contact@{id}.com</p>
            </div>
            <div class="info-item">
                <a href="{fb}" target="_blank">
                    <i class="fab fa-facebook-square" style="font-size: 2.5rem; color: #1877F2;"></i>
                    <h3>Facebook</h3>
                    <p>Suivez-nous</p>
                </a>
            </div>
        </div>
    </section>

    <footer>
        <p>&copy; 2024 {name}. Tous droits réservés. | Fièrement établi à Yaoundé, Cameroun.</p>
    </footer>
</body>
</html>
"""

base_dir = "websites"

for center in centers:
    center_dir = os.path.join(base_dir, center["id"])
    
    html_content = html_template.format(
        name=center["name"], 
        desc=center["desc"],
        color=center["color"],
        bg=center["bg"],
        id=center["id"],
        fb=center["fb"],
        s1=center["services"][0],
        s2=center["services"][1],
        s3=center["services"][2],
        s4=center["services"][3]
    )
    with open(os.path.join(center_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(html_content)

print("Modern websites with Facebook links generated successfully.")
