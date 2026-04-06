# Deployment Guide

## Pre-Deployment Checklist

### Security
- [ ] All `.env` files are in `.gitignore`
- [ ] Production database credentials are secure
- [ ] CORS_ORIGINS set to production domain(s)
- [ ] Rate limiting configured appropriately
- [ ] HTTPS/TLS certificates configured
- [ ] Security headers configured (Helmet.js)
- [ ] Authentication implemented (if required)

### Configuration
- [ ] NODE_ENV=production
- [ ] Database connection string updated
- [ ] API URL updated in client
- [ ] Error monitoring configured (Sentry, etc.)
- [ ] Logging configured
- [ ] Backup strategy in place

### Testing
- [ ] All features tested in production-like environment
- [ ] Load testing completed
- [ ] Database migrations tested
- [ ] Error scenarios tested
- [ ] Mobile responsiveness verified

## Deployment Options

### Option 1: Traditional VPS (DigitalOcean, AWS EC2, etc.)

#### Server Setup

1. Install Node.js 18+
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. Install PM2 for process management
```bash
sudo npm install -g pm2
```

3. Clone and setup
```bash
git clone <your-repo>
cd AttendX/server
npm install --production
```

4. Configure environment
```bash
cp .env.example .env
nano .env  # Edit with production values
```

5. Start with PM2
```bash
pm2 start index.js --name attendx-server
pm2 save
pm2 startup  # Follow instructions
```

#### Client Setup

1. Build the client
```bash
cd ../client
npm install
npm run build
```

2. Serve with Nginx
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        root /path/to/AttendX/client/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. Enable HTTPS with Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Option 2: Vercel (Client) + Railway/Render (Server)

#### Deploy Server to Railway

1. Create account at railway.app
2. New Project → Deploy from GitHub
3. Select your repository
4. Add environment variables in Railway dashboard
5. Railway will auto-deploy on push

#### Deploy Client to Vercel

1. Create account at vercel.com
2. Import project from GitHub
3. Framework: Vite
4. Build command: `npm run build`
5. Output directory: `dist`
6. Add environment variable: `VITE_API_URL=https://your-railway-url.com`
7. Deploy

### Option 3: Docker

#### Dockerfile (Server)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3001
CMD ["node", "index.js"]
```

#### Dockerfile (Client)
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### docker-compose.yml
```yaml
version: '3.8'
services:
  server:
    build: ./server
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NODE_ENV=production
      - CORS_ORIGINS=${CORS_ORIGINS}
    restart: unless-stopped

  client:
    build: ./client
    ports:
      - "80:80"
    depends_on:
      - server
    restart: unless-stopped
```

Deploy:
```bash
docker-compose up -d
```

## Database Setup

### NeonDB (Recommended for PostgreSQL)

1. Create account at neon.tech
2. Create new project
3. Copy connection string
4. Update DATABASE_URL in server/.env
5. Database tables will auto-create on first run

### Self-Hosted PostgreSQL

1. Install PostgreSQL
```bash
sudo apt install postgresql postgresql-contrib
```

2. Create database and user
```sql
CREATE DATABASE attendx;
CREATE USER attendx_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE attendx TO attendx_user;
```

3. Update connection string
```
DATABASE_URL=postgresql://attendx_user:secure_password@localhost:5432/attendx?sslmode=disable
```

## Monitoring

### PM2 Monitoring
```bash
pm2 monit
pm2 logs attendx-server
pm2 status
```

### Health Check Endpoint
Add to server/index.js:
```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

### Uptime Monitoring
- UptimeRobot (free)
- Pingdom
- StatusCake

## Backup Strategy

### Database Backups

#### Automated with cron (NeonDB)
```bash
# Add to crontab (crontab -e)
0 2 * * * pg_dump $DATABASE_URL > /backups/attendx_$(date +\%Y\%m\%d).sql
```

#### Retention policy
```bash
# Keep last 30 days
find /backups -name "attendx_*.sql" -mtime +30 -delete
```

## Troubleshooting

### Server won't start
- Check logs: `pm2 logs attendx-server`
- Verify DATABASE_URL is correct
- Ensure port 3001 is available
- Check firewall rules

### Database connection fails
- Verify connection string format
- Check database is running
- Verify network access (firewall, security groups)
- Test DNS resolution

### CORS errors
- Verify CORS_ORIGINS includes your domain
- Check protocol (http vs https)
- Verify no trailing slashes

### Rate limiting too aggressive
- Adjust in server/index.js
- Consider IP whitelisting for known clients

## Performance Optimization

### Server
- Enable gzip compression
- Add Redis for session storage
- Implement caching headers
- Use CDN for static assets

### Database
- Add indexes on frequently queried columns
- Enable connection pooling (already configured)
- Monitor slow queries
- Regular VACUUM and ANALYZE

### Client
- Enable Vite build optimizations (already configured)
- Lazy load components
- Optimize images
- Use service workers for offline support

## Rollback Procedure

1. Identify last working commit
```bash
git log --oneline
```

2. Rollback server
```bash
cd server
git checkout <commit-hash>
npm install
pm2 restart attendx-server
```

3. Rollback client
```bash
cd client
git checkout <commit-hash>
npm install
npm run build
# Copy dist to web server
```

4. Restore database if needed
```bash
psql $DATABASE_URL < /backups/attendx_YYYYMMDD.sql
```

## Support

For deployment issues:
1. Check logs first
2. Review this guide
3. Check SECURITY.md
4. Open GitHub issue with details
