# Vercel Deployment Guide for AttendX

## Prerequisites
1. GitHub account
2. Vercel account (sign up at vercel.com)
3. NeonDB database (already configured)

## Step 1: Prepare Your Repository

### Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit - AttendX ready for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/attendx.git
git push -u origin main
```

## Step 2: Deploy to Vercel

### Option A: Using Vercel Dashboard (Recommended)

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `cd client && npm install && npm run build`
   - **Output Directory**: `client/dist`
   - **Install Command**: `npm install`

4. Add Environment Variables:
   ```
   DATABASE_URL=your_neondb_connection_string
   NODE_ENV=production
   CORS_ORIGINS=https://your-app.vercel.app
   PORT=3001
   ```

5. Click "Deploy"

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? attendx
# - Directory? ./
# - Override settings? No

# Add environment variables
vercel env add DATABASE_URL
vercel env add NODE_ENV
vercel env add CORS_ORIGINS

# Deploy to production
vercel --prod
```

## Step 3: Configure Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables:

### Required Variables:
```
DATABASE_URL = postgresql://user:pass@host/db?sslmode=require
NODE_ENV = production
CORS_ORIGINS = https://your-app.vercel.app,https://your-app-git-main.vercel.app
PORT = 3001
```

### Optional Variables:
```
VITE_API_URL = /api
```

## Step 4: Update CORS Origins

After first deployment, update `server/index.js`:

```javascript
const corsOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : process.env.NODE_ENV === 'production'
  ? ['https://attendx.vercel.app'] // ← Update with your actual domain
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];
```

Then redeploy:
```bash
git add .
git commit -m "Update CORS for production"
git push
```

## Step 5: Verify Deployment

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Test features:
   - ✅ Add member
   - ✅ Mark attendance
   - ✅ Download Excel
   - ✅ Delete member
   - ✅ Change month/year
   - ✅ Dark mode toggle

3. Check API health: `https://your-app.vercel.app/api/health`

## Troubleshooting

### Issue: CORS Errors
**Solution**: Add your Vercel domain to CORS_ORIGINS environment variable

### Issue: Database Connection Failed
**Solution**: 
1. Verify DATABASE_URL is correct
2. Check NeonDB allows connections from Vercel IPs
3. Ensure `sslmode=require` is in connection string

### Issue: 404 on API Routes
**Solution**: Check `vercel.json` routes configuration

### Issue: Build Failed
**Solution**: 
1. Check build logs in Vercel dashboard
2. Verify all dependencies are in package.json
3. Run `npm run build` locally first

### Issue: Environment Variables Not Working
**Solution**: 
1. Redeploy after adding env vars
2. Check variable names match exactly
3. No quotes needed in Vercel dashboard

## Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update CORS_ORIGINS with new domain

## Monitoring

### View Logs
```bash
vercel logs
```

### View Deployments
```bash
vercel ls
```

### Rollback
```bash
vercel rollback
```

## Production Checklist

- [ ] Environment variables configured
- [ ] CORS origins updated
- [ ] Database connection tested
- [ ] All features working
- [ ] Dark mode working
- [ ] Mobile responsive
- [ ] Excel download working
- [ ] Error handling tested
- [ ] Performance acceptable

## Automatic Deployments

Vercel automatically deploys:
- **Production**: Pushes to `main` branch
- **Preview**: Pull requests and other branches

## Cost

- **Free Tier**: 
  - 100 GB bandwidth/month
  - Unlimited deployments
  - Perfect for this app

## Support

- Vercel Docs: https://vercel.com/docs
- Vercel Discord: https://vercel.com/discord
- GitHub Issues: Your repo issues page

---

**Your app will be live at**: `https://your-project-name.vercel.app`

Enjoy your deployed AttendX application! 🚀
