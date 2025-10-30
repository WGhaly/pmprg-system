#!/bin/bash

# PMPRG Vercel Deployment Script
# This script helps prepare and deploy the PMPRG application to Vercel

set -e

echo "🚀 PMPRG Vercel Deployment Script"
echo "=================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Make sure you're in the project root directory."
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found. Creating from .env.example..."
    cp .env.example .env.local
    echo "📝 Please edit .env.local with your database credentials before deploying."
    read -p "Press Enter when ready to continue..."
fi

# Build the project locally to check for errors
echo "🔨 Building project locally..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Local build successful!"
else
    echo "❌ Local build failed. Please fix errors before deploying."
    exit 1
fi

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📋 Post-deployment checklist:"
echo "1. Set environment variables in Vercel dashboard:"
echo "   - DATABASE_URL (your PostgreSQL connection string)"
echo "   - NEXTAUTH_SECRET (generate a secure random string)"
echo "   - NEXTAUTH_URL (your Vercel app URL)"
echo ""
echo "2. Run database migrations:"
echo "   npx vercel env pull .env.local"
echo "   DATABASE_URL='your_production_url' npx prisma migrate deploy"
echo "   DATABASE_URL='your_production_url' npx prisma db seed"
echo ""
echo "3. Test your deployed application"
echo ""
echo "🔐 Login credentials:"
echo "   Username: admin"
echo "   Password: pmprg2024"