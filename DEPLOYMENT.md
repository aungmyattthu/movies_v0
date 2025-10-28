# AWS Lightsail Deployment Guide

## Current Setup

- ✅ 1GB RAM instance (Lightsail)
- ✅ PM2 process manager
- ✅ Git post-receive hook
- ✅ Auto-build and deploy on push
- ✅ MySQL RDS database

## Prerequisites on Server

- Node.js 18+ installed
- PM2 installed globally: `npm install -g pm2`
- pnpm installed globally: `npm install -g pnpm`
- MySQL database configured
- SSH key configured for GitHub access (for private repo)

## Deployment Steps

### 1. Setup SSH Key on Server (First Time Only)

```bash
ssh aws-server

# Generate SSH key on server
ssh-keygen -t ed25519 -C "your-email@example.com" -f ~/.ssh/id_ed25519_github

# Display public key to add to GitHub
cat ~/.ssh/id_ed25519_github.pub
```

Copy the output and add it to GitHub:

- Go to GitHub → Settings → SSH and GPG keys → New SSH key
- Paste the public key

Configure SSH:

```bash
nano ~/.ssh/config
```

Add:

```
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_github
  IdentitiesOnly yes
```

Test connection:

```bash
ssh -T git@github.com
```

### 2. Clone Repository (First Time Only)

```bash
# Create apps directory
sudo mkdir -p /apps
sudo chown $USER:$USER /apps

# Clone repository
cd /apps
git clone git@github.com:aungmyattthu/movies_v0.git
cd movies_v0
```

### 2. Clone repository (first time only)

```bash
cd /var/www
git clone <your-repo-url> movie-api
cd movie-api
```

### 3. Create .env file

```bash
nano .env
```

Copy from `.env.example` and fill in your actual values:

- Database credentials
- JWT secret
- Upload directory paths

### 4. Run deployment script

```bash
./deploy.sh
```

## Manual Deployment (Alternative)

```bash
# Install dependencies
pnpm install --prod

# Build application
pnpm run build

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

## Useful PM2 Commands

```bash
# View logs
pm2 logs movie-api

# Monitor app
pm2 monit

# Restart app
pm2 restart movie-api

# Stop app
pm2 stop movie-api

# View status
pm2 status

# Delete from PM2
pm2 delete movie-api
```

## Update Deployment

### Auto-Deploy with Git Push (Recommended)

```bash
# Make changes, commit, and deploy
git add .
git commit -m "your changes"
git push production main
```

This will automatically:

1. Push code to server
2. Install dependencies
3. Build application
4. Restart PM2
5. Show status

### Alternative: Push to GitHub + Manual Deploy

```bash
# Push to GitHub
git push origin main

# Deploy to production
git push production main
```

### Manual Deployment

```bash
# SSH and deploy manually
ssh aws-server
cd /apps/movies_v0
git pull origin main
./deploy.sh
```

### Quick Deploy from Local

```bash
# One command deploy
./deploy-remote.sh
```

### Method 2: Automated CI/CD with GitHub Actions

Setup GitHub Secrets (one-time):

1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Add these secrets:
   - `LIGHTSAIL_HOST`: `47.128.81.163`
   - `LIGHTSAIL_USER`: `admin`
   - `LIGHTSAIL_SSH_KEY`: Your local private key (from `cat ~/.ssh/id_ed25519_catstackdev`)

After setup, every push to `main` branch will auto-deploy!

### Quick Commands

```bash
# From local machine - push and auto-deploy (if GitHub Actions enabled)
git add .
git commit -m "your changes"
git push origin main

# Manual deploy from local
ssh aws-server "cd /apps/movies_v0 && git pull && ./deploy.sh"
```

## Database Setup

```bash
sudo mysql -u root -p

CREATE DATABASE movies;
CREATE USER 'movieuser'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON movies.* TO 'movieuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Nginx Configuration (Optional)

Create `/etc/nginx/sites-available/movie-api`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/movie-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Firewall Configuration

Open required ports in Lightsail console:

- Port 80 (HTTP)
- Port 443 (HTTPS) - if using SSL
- Port 3000 (optional, if not using Nginx)

## Troubleshooting

```bash
# Check app logs
pm2 logs movie-api --lines 100

# Check if app is running
pm2 status

# Check database connection
mysql -u movieuser -p movies

# Restart everything
pm2 restart movie-api
```
