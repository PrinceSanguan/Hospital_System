#!/bin/bash

# Custom build script for Laravel Cloud

# Install dependencies with legacy peer deps to handle React 19 compatibility
npm ci --legacy-peer-deps

# Explicitly install the missing @radix-ui/react-switch package
npm install @radix-ui/react-switch --legacy-peer-deps

# Build assets
npm run build

# Run Laravel migrations
php artisan migrate --force

# Clear caches
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear

echo "Custom build completed successfully!"
