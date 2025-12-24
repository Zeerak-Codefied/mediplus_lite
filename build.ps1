# MediPlus Lite Build Script
# This script copies all necessary files to the build directory

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MediPlus Lite - Build Process" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$sourceDir = $PSScriptRoot
$buildDir = Join-Path $sourceDir "build"

# Create build directory if it doesn't exist
if (-not (Test-Path $buildDir)) {
    Write-Host "Creating build directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $buildDir | Out-Null
}

Write-Host "Source Directory: $sourceDir" -ForegroundColor Green
Write-Host "Build Directory: $buildDir" -ForegroundColor Green
Write-Host ""

# Function to copy files with progress
function Copy-FilesWithProgress {
    param(
        [string]$Source,
        [string]$Destination,
        [string]$Description
    )
    
    if (Test-Path $Source) {
        Write-Host "Copying $Description..." -ForegroundColor Yellow
        $destDir = Split-Path $Destination -Parent
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        Copy-Item -Path $Source -Destination $Destination -Recurse -Force
        Write-Host "  [OK] $Description copied" -ForegroundColor Green
    } else {
        Write-Host "  [SKIP] $Description not found" -ForegroundColor Gray
    }
}

# Copy HTML files
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "Copying HTML files..." -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan
Get-ChildItem -Path $sourceDir -Filter "*.html" -File | ForEach-Object {
    Copy-FilesWithProgress -Source $_.FullName -Destination (Join-Path $buildDir $_.Name) -Description "HTML: $($_.Name)"
}

# Copy CSS files
Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "Copying CSS files..." -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan
if (Test-Path (Join-Path $sourceDir "css")) {
    Copy-FilesWithProgress -Source (Join-Path $sourceDir "css") -Destination (Join-Path $buildDir "css") -Description "CSS directory"
}
if (Test-Path (Join-Path $sourceDir "style.css")) {
    Copy-FilesWithProgress -Source (Join-Path $sourceDir "style.css") -Destination (Join-Path $buildDir "style.css") -Description "style.css"
}

# Copy JS files
Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "Copying JavaScript files..." -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan
if (Test-Path (Join-Path $sourceDir "js")) {
    Copy-FilesWithProgress -Source (Join-Path $sourceDir "js") -Destination (Join-Path $buildDir "js") -Description "JavaScript directory"
}

# Copy Images
Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "Copying Images..." -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan
if (Test-Path (Join-Path $sourceDir "img")) {
    Copy-FilesWithProgress -Source (Join-Path $sourceDir "img") -Destination (Join-Path $buildDir "img") -Description "Images directory"
}

# Copy Fonts
Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "Copying Fonts..." -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan
if (Test-Path (Join-Path $sourceDir "fonts")) {
    Copy-FilesWithProgress -Source (Join-Path $sourceDir "fonts") -Destination (Join-Path $buildDir "fonts") -Description "Fonts directory"
}

# Copy PHP files (API and Mail)
Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "Copying PHP files..." -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan
if (Test-Path (Join-Path $sourceDir "api")) {
    Copy-FilesWithProgress -Source (Join-Path $sourceDir "api") -Destination (Join-Path $buildDir "api") -Description "API directory"
}
if (Test-Path (Join-Path $sourceDir "mail")) {
    Copy-FilesWithProgress -Source (Join-Path $sourceDir "mail") -Destination (Join-Path $buildDir "mail") -Description "Mail directory"
}

# Copy Assets
Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "Copying Assets..." -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan
if (Test-Path (Join-Path $sourceDir "assets")) {
    Copy-FilesWithProgress -Source (Join-Path $sourceDir "assets") -Destination (Join-Path $buildDir "assets") -Description "Assets directory"
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Build Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Build directory: $buildDir" -ForegroundColor Green
Write-Host ""
Write-Host "Files copied:" -ForegroundColor Yellow
$htmlCount = (Get-ChildItem -Path $buildDir -Filter "*.html" -File).Count
$cssCount = (Get-ChildItem -Path (Join-Path $buildDir "css") -Filter "*.css" -File -ErrorAction SilentlyContinue).Count
$jsCount = (Get-ChildItem -Path (Join-Path $buildDir "js") -Filter "*.js" -File -ErrorAction SilentlyContinue).Count
$imgCount = (Get-ChildItem -Path (Join-Path $buildDir "img") -File -ErrorAction SilentlyContinue).Count

Write-Host "  - HTML files: $htmlCount" -ForegroundColor White
Write-Host "  - CSS files: $cssCount" -ForegroundColor White
Write-Host "  - JS files: $jsCount" -ForegroundColor White
Write-Host "  - Images: $imgCount" -ForegroundColor White
Write-Host ""
Write-Host "Build is ready for deployment!" -ForegroundColor Green
Write-Host ""

