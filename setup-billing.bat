@echo off
REM Backend Setup Script for Windows

echo 🚀 Setting up Stripe billing system...

REM Check if server directory exists
if not exist "server" (
    echo ❌ server directory not found!
    exit /b 1
)

REM Navigate to server directory
cd server

REM Check if package.json exists
if not exist "package.json" (
    echo 📝 Creating package.json...
    (
        echo {
        echo   "name": "stripe-billing-server",
        echo   "version": "1.0.0",
        echo   "description": "Stripe billing backend for AI Business Management",
        echo   "main": "index.js",
        echo   "scripts": {
        echo     "start": "node index.js",
        echo     "dev": "nodemon index.js"
        echo   },
        echo   "dependencies": {
        echo     "express": "^4.18.2",
        echo     "stripe": "^14.0.0",
        echo     "dotenv": "^16.3.1",
        echo     "cors": "^2.8.5"
        echo   },
        echo   "devDependencies": {
        echo     "nodemon": "^3.0.1"
        echo   }
        echo }
    ) > package.json
    echo ✅ package.json created
)

REM Check if .env exists
if not exist ".env" (
    if exist ".env.example" (
        echo ⚠️  .env not found. Creating from .env.example...
        copy .env.example .env
        echo ⚠️  Please edit server\.env with your Stripe keys
    )
)

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

echo.
echo ✅ Setup complete!
echo.
echo 📝 Next steps:
echo 1. Edit server\.env with your Stripe keys
echo 2. Run: npm start (in server directory^)
echo 3. Run: npm run dev (in root directory^)
echo.
echo Get your Stripe keys from: https://dashboard.stripe.com/apikeys
echo.
pause
