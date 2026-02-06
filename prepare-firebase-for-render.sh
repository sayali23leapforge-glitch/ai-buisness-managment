#!/bin/bash

echo "============================================"
echo "Firebase Service Account Converter for Render"
echo "============================================"
echo ""
echo "This script will help you convert your firebase-service-account.json"
echo "to a single-line string for use as an environment variable in Render."
echo ""

if [ ! -f "server/firebase-service-account.json" ]; then
    echo "ERROR: firebase-service-account.json not found in server directory!"
    echo "Please make sure the file exists before running this script."
    exit 1
fi

echo "Reading firebase-service-account.json..."
echo ""

# Read and minify JSON
json=$(cat server/firebase-service-account.json | tr -d '\n' | tr -d ' ')

echo ""
echo "Copy the following value and paste it as FIREBASE_SERVICE_ACCOUNT in Render:"
echo ""
echo "================================================"
echo "$json"
echo "================================================"
echo ""
echo "Instructions:"
echo "1. Copy the text above (everything between the === lines)"
echo "2. Go to your Render dashboard"
echo "3. Add new environment variable: FIREBASE_SERVICE_ACCOUNT"
echo "4. Paste the copied text as the value"
echo ""
