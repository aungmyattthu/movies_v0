#!/bin/bash

echo "🚀 Deploying to AWS Lightsail..."

ssh aws-server << 'ENDSSH'
cd /apps/movies_v0
echo "📥 Pulling latest changes..."
git pull origin main
echo "🔄 Running deployment script..."
./deploy.sh
ENDSSH

echo "✅ Deployment complete!"
echo "📊 Check status: ssh aws-server 'pm2 status'"
echo "📝 View logs: ssh aws-server 'pm2 logs movie-api'"
