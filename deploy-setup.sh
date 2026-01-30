#!/bin/bash
# Production Server Setup Script for uavdy.com
# Server: 5.175.136.74

set -e

echo "🚀 Starting production server setup..."

# 1. Configure fail2ban
echo "⚙️ Configuring fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban

# 2. Configure firewall
echo "🔒 Setting up firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 5432/tcp
echo "y" | ufw enable

# 3. Install Node.js 20.x
echo "📦 Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2

# 4. Setup PostgreSQL
echo "🗄️ Setting up PostgreSQL..."
sudo -u postgres psql -c "CREATE USER restaurant_app WITH PASSWORD 'RestaurantDB2024Secure';" || echo "User exists"
sudo -u postgres psql -c "CREATE DATABASE restaurant_tracking OWNER restaurant_app;" || echo "Database exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE restaurant_tracking TO restaurant_app;"

# 5. Clone repository
echo "📥 Cloning repository..."
cd /var/www
rm -rf takip
git clone https://github.com/sumorf-r/takip.git
cd takip

# 6. Create production environment file
echo "📝 Creating production environment..."
cat > .env.production << 'EOF'
# Production Environment
VITE_DB_HOST=localhost
VITE_DB_PORT=5432
VITE_DB_NAME=restaurant_tracking
VITE_DB_USER=restaurant_app
VITE_DB_PASSWORD=RestaurantDB2024Secure
VITE_DB_SSL=false

JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=24h

VITE_API_URL=https://uavdy.com/.netlify/functions
VITE_APP_URL=https://uavdy.com

VITE_QR_REFRESH_INTERVAL=90000
EOF

# 7. Install dependencies and build
echo "🔨 Building application..."
npm install
npm run build

# 8. Initialize database
echo "💾 Initializing database..."
PGPASSWORD=RestaurantDB2024Secure psql -h localhost -U restaurant_app -d restaurant_tracking -f database/init/01-schema.sql || true
PGPASSWORD=RestaurantDB2024Secure psql -h localhost -U restaurant_app -d restaurant_tracking -f database/init/02-initial-data.sql || true
PGPASSWORD=RestaurantDB2024Secure psql -h localhost -U restaurant_app -d restaurant_tracking -f database/init/03-mesai-hesaplama.sql || true

# 9. Setup Nginx
echo "🌐 Configuring Nginx..."
cat > /etc/nginx/sites-available/uavdy.com << 'EOF'
server {
    listen 80;
    server_name uavdy.com www.uavdy.com;

    root /var/www/takip/dist;
    index index.html;

    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API endpoints
    location /.netlify/functions/ {
        proxy_pass http://localhost:8888/.netlify/functions/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/uavdy.com /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# 10. Setup PM2 for Netlify Dev (functions)
echo "🚀 Starting application with PM2..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'takip-functions',
    script: 'npx',
    args: 'netlify dev --port 8888',
    cwd: '/var/www/takip',
    env: {
      NODE_ENV: 'production',
      PORT: 8888
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
}
EOF

pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root

# 11. Setup SSL with Let's Encrypt
echo "🔐 Setting up SSL certificate..."
certbot --nginx -d uavdy.com -d www.uavdy.com --non-interactive --agree-tos --email admin@uavdy.com --redirect || echo "SSL setup will be done after DNS is configured"

# 12. Create auto-deployment script
echo "🔄 Creating auto-deployment script..."
cat > /root/deploy-takip.sh << 'EOF'
#!/bin/bash
cd /var/www/takip
git pull origin main
npm install
npm run build
pm2 restart takip-functions
echo "✅ Deployment completed at $(date)"
EOF

chmod +x /root/deploy-takip.sh

# 13. Setup GitHub webhook endpoint
cat > /root/webhook.js << 'EOF'
const http = require('http');
const { exec } = require('child_process');

http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    console.log('Webhook received, starting deployment...');
    exec('/root/deploy-takip.sh', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error}`);
        return;
      }
      console.log(`Output: ${stdout}`);
    });
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Deployment started\n');
  } else {
    res.writeHead(404);
    res.end();
  }
}).listen(9000, () => {
  console.log('Webhook server listening on port 9000');
});
EOF

pm2 start /root/webhook.js --name webhook
pm2 save

echo "✅ Setup completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Point your domain uavdy.com to this server IP: 5.175.136.74"
echo "2. Wait for DNS propagation (5-30 minutes)"
echo "3. Run: certbot --nginx -d uavdy.com -d www.uavdy.com"
echo "4. Add webhook URL to GitHub: http://uavdy.com:9000/webhook"
echo ""
echo "🌐 Your site will be available at: https://uavdy.com"
echo "🔐 Admin login: admin@restaurant.com / admin123"
