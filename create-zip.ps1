# Script to create a zip file from the built Electron app
# Usage: .\create-zip.ps1

$sourceDir = "dist\win-unpacked"
$zipPath = "dist\Flappy-Bird-Clone-Windows.zip"

if (-not (Test-Path $sourceDir)) {
    Write-Error "Source directory not found at $sourceDir"
    Write-Host "Please run 'npm run build:win' first to build the application."
    exit 1
}

Write-Host "Creating zip file from $sourceDir..."

# Remove existing zip if it exists
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
    Write-Host "Removed existing zip file."
}

# Create zip file
Compress-Archive -Path "$sourceDir\*" -DestinationPath $zipPath -Force

if (Test-Path $zipPath) {
    $fileSize = (Get-Item $zipPath).Length / 1MB
    Write-Host "Zip file created successfully: $zipPath" -ForegroundColor Green
    Write-Host "  File size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Cyan
} else {
    Write-Error "Failed to create zip file."
    exit 1
}

