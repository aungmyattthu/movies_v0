#!/bin/bash

set -e

echo "🚀 Starting deployment to AWS Lightsail..."

APP_NAME="movie-api"

echo "📦 Installing all dependencies with pnpm..."
pnpm install --frozen-lockfile

echo "🔨 Building application..."
pnpm run build

echo "🧹 Removing dev dependencies..."
pnpm prune --prod

echo "📁 Creating logs and uploads directories..."
mkdir -p logs uploads

echo "🔄 Restarting application with PM2..."
if pm2 describe $APP_NAME > /dev/null 2>&1; then
    echo "♻️  Reloading existing PM2 process..."
    pm2 reload ecosystem.config.js --update-env
else
    echo "🆕 Starting new PM2 process..."
    pm2 start ecosystem.config.js
    pm2 startup
fi

echo "💾 Saving PM2 configuration..."
pm2 save

echo "📊 PM2 status:"
pm2 status

echo "✅ Deployment completed successfully!"
echo "📝 Logs: pm2 logs $APP_NAME"
echo "📈 Monitor: pm2 monit"
