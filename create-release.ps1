# Script to create GitHub Release
# Requires: GitHub Personal Access Token with 'repo' scope
# Usage: .\create-release.ps1 -Token "your_github_token"

param(
    [Parameter(Mandatory=$true)]
    [string]$Token
)

$repo = "treysl/flappy-bird-clone"
$tag = "v1.0.0"
$releaseName = "Flappy Bird Clone v1.0.0"
$releaseBody = @"
## Flappy Bird Clone v1.0.0

Windows executable release of the Flappy Bird clone game.

### Installation
1. Download `Flappy-Bird-Clone-Windows.zip` from the assets below
2. Extract the zip file
3. Run `Flappy Bird Clone.exe`

### System Requirements
- Windows 10 or later
- No additional dependencies required

### Game Controls
- **SPACE** or **Click** to flap
- Avoid the pipes and don't hit the ground!

Enjoy the game!
"@

$zipPath = "dist\Flappy-Bird-Clone-Windows.zip"
if (-not (Test-Path $zipPath)) {
    Write-Error "Zip file not found at $zipPath"
    exit 1
}

# Create release
$headers = @{
    "Authorization" = "token $Token"
    "Accept" = "application/vnd.github.v3+json"
}

$releaseData = @{
    tag_name = $tag
    name = $releaseName
    body = $releaseBody
    draft = $false
    prerelease = $false
} | ConvertTo-Json

Write-Host "Creating release..."
$createUrl = "https://api.github.com/repos/$repo/releases"
$response = Invoke-RestMethod -Uri $createUrl -Method Post -Headers $headers -Body $releaseData -ContentType "application/json"

$uploadUrl = $response.upload_url -replace '\{.*\}', ''
$uploadUrl = "$uploadUrl?name=Flappy-Bird-Clone-Windows.zip"

Write-Host "Uploading zip file..."
$fileBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $zipPath))
$fileEnc = [System.Text.Encoding]::GetEncoding('ISO-8859-1').GetString($fileBytes)
$boundary = [System.Guid]::NewGuid().ToString()
$LF = "`r`n"
$bodyLines = (
    "--$boundary",
    "Content-Disposition: form-data; name=`"file`"; filename=`"Flappy-Bird-Clone-Windows.zip`"",
    "Content-Type: application/zip$LF",
    $fileEnc,
    "--$boundary--"
) -join $LF

$uploadHeaders = @{
    "Authorization" = "token $Token"
    "Accept" = "application/vnd.github.v3+json"
    "Content-Type" = "multipart/form-data; boundary=$boundary"
}

try {
    $uploadResponse = Invoke-RestMethod -Uri $uploadUrl -Method Post -Headers $uploadHeaders -Body $bodyLines
    Write-Host "Release created successfully!" -ForegroundColor Green
    Write-Host "Release URL: $($response.html_url)" -ForegroundColor Cyan
} catch {
    Write-Error "Failed to upload file: $_"
    Write-Host "Release was created but file upload failed. You can manually upload the file at:" -ForegroundColor Yellow
    Write-Host $response.html_url -ForegroundColor Cyan
}

