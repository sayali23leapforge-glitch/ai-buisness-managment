#!/bin/bash

echo "Building frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi

echo ""
echo "Starting production server..."
cd server
node index.js
