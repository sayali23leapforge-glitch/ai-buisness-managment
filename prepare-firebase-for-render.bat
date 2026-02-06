@echo off
echo ============================================
echo Firebase Service Account Converter for Render
echo ============================================
echo.
echo This script will help you convert your firebase-service-account.json
echo to a single-line string for use as an environment variable in Render.
echo.

if not exist "server\firebase-service-account.json" (
    echo ERROR: firebase-service-account.json not found in server directory!
    echo Please make sure the file exists before running this script.
    pause
    exit /b 1
)

echo Reading firebase-service-account.json...
echo.

powershell -Command "$json = Get-Content -Raw 'server\firebase-service-account.json' | ConvertFrom-Json | ConvertTo-Json -Compress; Write-Host ''; Write-Host 'Copy the following value and paste it as FIREBASE_SERVICE_ACCOUNT in Render:'; Write-Host ''; Write-Host '================================================'; Write-Host $json; Write-Host '================================================'; Write-Host ''; Write-Host 'Instructions:'; Write-Host '1. Copy the text above (everything between the === lines)'; Write-Host '2. Go to your Render dashboard'; Write-Host '3. Add new environment variable: FIREBASE_SERVICE_ACCOUNT'; Write-Host '4. Paste the copied text as the value'; Write-Host ''; Write-Host 'Press any key to exit...'; $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')"
