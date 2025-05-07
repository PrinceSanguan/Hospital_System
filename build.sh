#!/bin/bash

# Custom build script for Laravel Cloud

# Use the production version of package.json
cp package.production.json package.json

# Make fix-npm.js script executable
chmod +x fix-npm.js

# Install dependencies with force flag to handle React 19 compatibility
npm ci --force

# Run our custom dependency fixer for React 19
node fix-npm.js

# Build assets with increased memory
NODE_OPTIONS=--max_old_space_size=4096 npm run build

# Run Laravel migrations
php artisan migrate --force

# Clear caches
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear

echo "Custom build completed successfully!"
