$project = "siteweb-2988f"
$generatedDir = "C:\Users\RAM\myBusiness\business-site-generator\generated"

Get-ChildItem -Path $generatedDir -Directory | ForEach-Object {
    $siteName = $_.Name
    $targetName = "ys-cm-$siteName"
    
    # Remplacer les caractères non autorisés (max 30 chars, lowercase, hyphens only)
    $targetName = $targetName.ToLower() -replace '[^a-z0-9-]', '-'
    
    # Firebase limite les ID à 30 caractères, on coupe si c'est trop long
    if ($targetName.Length -gt 29) {
        $targetName = $targetName.Substring(0, 29)
    }
    
    # Nettoyer les tirets à la fin
    $targetName = $targetName.TrimEnd('-')

    Write-Host "========================================="
    Write-Host "Creation du site Firebase: $targetName"
    Write-Host "========================================="
    
    # 1. Créer le site sur le projet Firebase
    firebase hosting:sites:create $targetName --project $project
    
    # 2. Créer le fichier firebase.json temporaire pour ce site
    $firebaseJson = @"
{
  "hosting": {
    "site": "$targetName",
    "public": "generated/$siteName",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ]
  }
}
"@
    Set-Content -Path "C:\Users\RAM\myBusiness\business-site-generator\firebase.json" -Value $firebaseJson -Encoding UTF8
    
    # 3. Déployer
    Write-Host "Deploiement de $siteName vers https://$targetName.web.app"
    Set-Location "C:\Users\RAM\myBusiness\business-site-generator"
    firebase deploy --only hosting --project $project
    
    Write-Host "Terminé pour $siteName !"
    Write-Host ""
}
