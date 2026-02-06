#!/bin/bash

# Backend Setup Script

echo "🚀 Setting up Stripe billing system..."

# Check if server directory exists
if [ ! -d "server" ]; then
    echo "❌ server directory not found!"
    exit 1
fi

# Navigate to server directory
cd server

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "📝 Creating package.json..."
    cat > package.json << 'EOF'
{
  "name": "stripe-billing-server",
  "version": "1.0.0",
  "description": "Stripe billing backend for AI Business Management",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "stripe": "^14.0.0",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
EOF
    echo "✅ package.json created"
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "⚠️  .env not found. Creating from .env.example..."
        cp .env.example .env
        echo "⚠️  Please edit .env with your Stripe keys"
    fi
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Edit server/.env with your Stripe keys"
echo "2. Run: npm start (in server directory)"
echo "3. Run: npm run dev (in root directory)"
echo ""
echo "Get your Stripe keys from: https://dashboard.stripe.com/apikeys"
