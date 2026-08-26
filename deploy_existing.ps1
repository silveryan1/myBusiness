$deployments = @(
    @{ folder="websites\cmpj-yaounde3"; projectId="ys-cm-cmpj-yaounde3-9920" },
    @{ folder="websites\fcm-formation"; projectId="ys-cm-fcm-formation-9920" },
    @{ folder="websites\jpnil-formation"; projectId="ys-cm-jpnil-formation-9920" },
    @{ folder="websites\saint-mathis-sante"; projectId="ys-cm-saint-mathis-sante-9920" },
    @{ folder="websites\telec-formation"; projectId="ys-cm-telec-formation-9920" },
    @{ folder="websites\talent-dor-fc"; projectId="ys-cm-talent-dor-fc-2573" },
    @{ folder="websites\cfp-regine-norah"; projectId="ys-cm-cfp-regine-norah-2573" },
    @{ folder="websites\scan-snap-formation"; projectId="ys-cm-scan-snap-formation-2573" }
)

foreach ($deploy in $deployments) {
    Write-Host "Deploying $($deploy.folder) to $($deploy.projectId)..."
    Push-Location $deploy.folder
    firebase deploy --project $deploy.projectId --only hosting
    Pop-Location
}

Write-Host "All modern deployments finished!"
