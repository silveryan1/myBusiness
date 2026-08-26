$centers = @(
    @{ id="talent-dor-fc"; name="Talent D'or FC" },
    @{ id="cfp-regine-norah"; name="CFP Regine Norah" },
    @{ id="cf-agriculture-yaounde"; name="CF Agriculture Yaounde" },
    @{ id="lead-vocational-center"; name="Lead Vocational Center" },
    @{ id="scan-snap-formation"; name="Scan Snap Formation" },
    @{ id="jpnil-formation"; name="JPNIL Formation" },
    @{ id="saint-mathis-sante"; name="Saint Mathis Sante" },
    @{ id="cmpj-yaounde3"; name="CMPJ Yaounde 3" },
    @{ id="telec-formation"; name="TELEC Formation" },
    @{ id="fcm-formation"; name="FCM Formation" }
)

$suffix = Get-Random -Maximum 9999
$prefix = "ys-cm-"

foreach ($center in $centers) {
    $folder = "websites\" + $center.id
    $projectId = $prefix + $center.id
    if ($projectId.Length -gt 30) {
        $projectId = $projectId.Substring(0, 30)
    }
    $projectId = $projectId.ToLower() -replace '[^a-z0-9-]', ''
    $projectId = "$projectId-$suffix"
    
    Write-Host "Creating project $projectId for $($center.name)..."
    firebase projects:create $projectId -n $center.name
    
    Write-Host "Deploying to Firebase Hosting for $projectId..."
    Push-Location $folder
    firebase deploy --project $projectId --only hosting
    Pop-Location
}

Write-Host "All deployments finished!"
