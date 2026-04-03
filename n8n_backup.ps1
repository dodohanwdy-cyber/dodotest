$OutputEncoding = [Console]::InputEncoding = [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding
$token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjOTgwOGZmMy03YmJmLTRjZTQtYTYxNy1jZTQ2ZjRjM2FjNTgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY5Njc3MjE1fQ.pI8-m8IOq-L_Mt7WAoqh6DEey6ABiQjssZI695suJfM'
$url = 'https://primary-production-1f39e.up.railway.app/api/v1/workflows'
$backupDir = 'G:\재택근무\n8n-data\n8n 백업'

if (-not (Test-Path -LiteralPath $backupDir)) {
    New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
}

$allWorkflows = @()
$currentUrl = $url

while ($currentUrl) {
    $res = Invoke-RestMethod -Uri $currentUrl -Headers @{ 'X-N8N-API-KEY' = $token } -Method Get
    if ($res.data) {
        $allWorkflows += $res.data
    }
    if ($res.nextCursor) {
        $currentUrl = "$url?cursor=$($res.nextCursor)"
    } else {
        $currentUrl = $null
    }
}

$count = 0
foreach ($wf in $allWorkflows) {
    # Replace invalid chars with underscore
    $cleanName = $wf.name -replace '[<>:"/\\|?*]', '_'
    $filePath = Join-Path -Path $backupDir -ChildPath "$cleanName.json"
    $wf | ConvertTo-Json -Depth 20 | Out-File -LiteralPath $filePath -Encoding UTF8
    $count++
}

Write-Output "Successfully backed up $count workflows to $backupDir"
