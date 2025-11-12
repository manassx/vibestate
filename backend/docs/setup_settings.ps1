# CursorGallery Settings Setup Script (PowerShell)
# This script helps you set up the user settings feature

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  CursorGallery Settings Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    Write-Host "Please create a .env file with your Supabase credentials first." -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ .env file found" -ForegroundColor Green
Write-Host ""

# Load environment variables from .env file
Get-Content ".env" | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        Set-Item -Path "env:$name" -Value $value
    }
}

if (-not $env:SUPABASE_URL -or -not $env:SUPABASE_KEY) {
    Write-Host "❌ Error: SUPABASE_URL or SUPABASE_KEY not set in .env" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Supabase credentials loaded" -ForegroundColor Green
Write-Host ""

Write-Host "Setting up user_settings table..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Please follow these steps:" -ForegroundColor White
Write-Host ""
Write-Host "1. Go to your Supabase Dashboard" -ForegroundColor White
Write-Host "   URL: https://app.supabase.com" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Select your project" -ForegroundColor White
Write-Host ""
Write-Host "3. Navigate to: SQL Editor (in the left sidebar)" -ForegroundColor White
Write-Host ""
Write-Host "4. Click 'New Query'" -ForegroundColor White
Write-Host ""
Write-Host "5. Copy and paste the SQL from:" -ForegroundColor White
Write-Host "   migrations/create_user_settings_table.sql" -ForegroundColor Gray
Write-Host ""
Write-Host "6. Click 'Run' or press Ctrl+Enter" -ForegroundColor White
Write-Host ""
Write-Host "7. Verify the table was created by running:" -ForegroundColor White
Write-Host "   SELECT * FROM user_settings LIMIT 1;" -ForegroundColor Gray
Write-Host ""

$response = Read-Host "Have you completed the database setup? (y/n)"

if ($response -notmatch '^[Yy]$') {
    Write-Host ""
    Write-Host "Please complete the database setup first." -ForegroundColor Yellow
    Write-Host "You can run this script again when ready." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  Setup Complete! ✓" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "The settings feature is now ready to use!" -ForegroundColor Green
Write-Host ""
Write-Host "Features available:" -ForegroundColor White
Write-Host "  ✓ Profile management (name, bio, website, location)" -ForegroundColor Cyan
Write-Host "  ✓ Password change with validation" -ForegroundColor Cyan
Write-Host "  ✓ Notification preferences" -ForegroundColor Cyan
Write-Host "  ✓ Gallery default settings" -ForegroundColor Cyan
Write-Host "  ✓ Data export" -ForegroundColor Cyan
Write-Host "  ✓ Account deletion" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access settings at: http://localhost:5173/settings" -ForegroundColor Yellow
Write-Host ""
Write-Host "For more information, see: SETTINGS_SETUP.md" -ForegroundColor Gray
Write-Host ""
