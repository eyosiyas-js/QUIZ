#!/bin/bash
# ============================================================
# ETEX Game — Automated SSL Certificate Setup
# ============================================================
set -e

if [ -z "$1" ]; then
    echo "❌ Missing domain argument."
    echo "Usage: ./setup-ssl.sh <your-domain> [your-email]"
    echo "Example: ./setup-ssl.sh quiz.example.com admin@example.com"
    exit 1
fi

DOMAIN=$1
EMAIL=${2:-"admin@$DOMAIN"}

echo "🔒 Starting SSL setup for domain: $DOMAIN"

# 1. Install certbot if not present
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing certbot..."
    sudo apt update
    sudo apt install -y certbot
fi

# 2. Stop nginx container briefly to free port 80 for certbot
echo "⏸️  Temporarily stopping nginx container to acquire certificate..."
docker compose stop nginx

# 3. Request certificate from Let's Encrypt
echo "📜 Requesting SSL certificate from Let's Encrypt..."
sudo certbot certonly --standalone \
    -d "$DOMAIN" \
    --non-interactive \
    --agree-tos \
    -m "$EMAIL" \
    --keep-until-expiring

# 4. Generate SSL nginx.conf from template
echo "⚙️  Configuring Nginx for HTTPS..."
sed "s/YOUR_DOMAIN/$DOMAIN/g" nginx/nginx.ssl.conf.template > nginx/nginx.conf

# 5. Start nginx with SSL enabled
echo "🚀 Starting Nginx with HTTPS enabled..."
docker compose up -d nginx

# 6. Configure automatic renewal post-hook
echo "🔄 Setting up automatic certificate renewal..."
sudo mkdir -p /etc/letsencrypt/renewal-hooks/deploy
PROJECT_DIR=$(pwd)
cat << EOF | sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh > /dev/null
#!/bin/sh
cd "$PROJECT_DIR" && docker compose exec -T nginx nginx -s reload 2>/dev/null || true
EOF
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh

echo ""
echo "============================================================"
echo "✅ SSL successfully configured!"
echo "🌐 Your app is now live at: https://$DOMAIN"
echo "🔐 Admin Dashboard: https://$DOMAIN/admin/"
echo "🔄 Automatic renewal is active via Certbot."
echo "============================================================"
