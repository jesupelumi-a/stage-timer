# 🚀 Deployment Guide

This guide covers deploying the StageTimer application to production using Vercel (frontend) and Render (backend + database).

## 📋 Prerequisites

- GitHub repository with your code
- Vercel account (free tier available)
- Render account (free tier available)
- Domain name (optional)

## 🗄️ Database Deployment (Render)

### Option 1: Render PostgreSQL (Recommended)

1. **Create PostgreSQL Service**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "PostgreSQL"
   - Choose a name: `stage-timer-db`
   - Select region closest to your users
   - Choose "Free" plan for testing
   - Click "Create Database"

2. **Get Connection Details**
   - Copy the "External Database URL"
   - Save it for backend configuration

### Option 2: Other PostgreSQL Providers

You can also use:
- **Supabase** (free tier with 500MB)
- **Railway** (free tier with 1GB)
- **Neon** (free tier with 3GB)
- **AWS RDS** (paid)

## 🖥️ Backend Deployment (Render)

1. **Create Web Service**
   - Go to Render Dashboard
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Choose the repository with your StageTimer code

2. **Configure Service**
   - **Name**: `stage-timer-backend`
   - **Region**: Same as your database
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: Leave empty
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `./backend/Dockerfile`

3. **Environment Variables**
   ```
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=[Your PostgreSQL connection string]
   FRONTEND_URL=https://your-frontend-domain.vercel.app
   SOCKET_CORS_ORIGIN=https://your-frontend-domain.vercel.app
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Test health endpoint: `https://your-backend.onrender.com/api/health`

## 🌐 Frontend Deployment (Vercel)

1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Project**
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`

3. **Environment Variables**
   ```
   VITE_API_URL=https://your-backend.onrender.com/api
   VITE_SOCKET_URL=https://your-backend.onrender.com
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Your app will be available at `https://your-project.vercel.app`

## 🔧 Post-Deployment Setup

### 1. Database Migrations

After backend deployment, run migrations:

```bash
# Connect to your Render backend service terminal
pnpm --filter backend db:migrate
```

Or use the Render dashboard shell to run:
```bash
cd backend && node -e "require('./dist/db/migrate.js')"
```

### 2. Test the Application

1. **Health Checks**
   - Backend: `https://your-backend.onrender.com/api/health`
   - Database: `https://your-backend.onrender.com/api/health/db`

2. **Frontend**
   - Open `https://your-frontend.vercel.app`
   - Create a test room
   - Test controller and display modes

3. **Real-time Sync**
   - Open controller in one browser tab
   - Open display in another tab (or device)
   - Test timer operations and message broadcasting

### 3. Custom Domain (Optional)

**Vercel Frontend:**
1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

**Render Backend:**
1. Go to Service Settings → Custom Domains
2. Add your API subdomain (e.g., `api.yourdomain.com`)
3. Update frontend environment variables

## 🔒 Security Considerations

### Environment Variables

Never commit sensitive data. Use environment variables for:
- Database connection strings
- API keys
- CORS origins
- JWT secrets (if added later)

### CORS Configuration

Ensure CORS is properly configured:
```javascript
// backend/src/index.ts
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
```

### Database Security

- Use strong passwords
- Enable SSL connections
- Restrict database access to your backend service
- Regular backups (automatic on most platforms)

## 📊 Monitoring & Maintenance

### Health Monitoring

Set up monitoring for:
- Backend health endpoint
- Database connectivity
- Socket.io connections
- Frontend availability

### Logs

**Render:**
- View logs in service dashboard
- Set up log retention
- Monitor error rates

**Vercel:**
- Function logs in dashboard
- Real-time monitoring
- Performance analytics

### Scaling

**Free Tier Limits:**
- Render: 750 hours/month, sleeps after 15min inactivity
- Vercel: 100GB bandwidth, 6000 minutes build time
- PostgreSQL: Storage limits vary by provider

**Upgrade Path:**
- Render: $7/month for always-on service
- Vercel: $20/month for Pro features
- Database: Upgrade based on storage/connection needs

## 🐛 Troubleshooting

### Common Issues

1. **Backend Won't Start**
   - Check environment variables
   - Verify database connection
   - Review build logs

2. **Frontend Can't Connect**
   - Verify API URL environment variable
   - Check CORS configuration
   - Test backend health endpoint

3. **Socket.io Connection Failed**
   - Verify Socket URL environment variable
   - Check firewall/proxy settings
   - Test WebSocket connectivity

4. **Database Connection Issues**
   - Verify connection string format
   - Check database service status
   - Test connection from backend logs

### Debug Commands

```bash
# Test backend locally with production env
DATABASE_URL="your-prod-db-url" pnpm dev:backend

# Test frontend with production API
VITE_API_URL="your-prod-api-url" pnpm dev:frontend

# Check database connectivity
psql "your-database-url"
```

## 🔄 CI/CD Pipeline

### Automatic Deployments

Both Vercel and Render support automatic deployments:

1. **Push to main branch** → Automatic deployment
2. **Pull request** → Preview deployment (Vercel)
3. **Environment promotion** → Staging → Production

### Build Optimization

- Enable build caching
- Optimize bundle size
- Use environment-specific builds
- Monitor build times

## 📈 Performance Optimization

### Frontend

- Enable Vercel Analytics
- Optimize images and assets
- Use CDN for static files
- Implement service worker for PWA

### Backend

- Enable compression
- Implement rate limiting
- Use connection pooling
- Monitor response times

### Database

- Optimize queries
- Add appropriate indexes
- Monitor connection usage
- Regular maintenance

## 🎯 Production Checklist

- [ ] Database deployed and accessible
- [ ] Backend deployed with health checks
- [ ] Frontend deployed and loading
- [ ] Environment variables configured
- [ ] CORS properly set up
- [ ] Socket.io connections working
- [ ] Real-time sync tested
- [ ] Custom domains configured (if applicable)
- [ ] Monitoring set up
- [ ] Backup strategy in place
- [ ] Documentation updated

## 🆘 Support

If you encounter issues:

1. Check the logs in your deployment platform
2. Verify environment variables
3. Test individual components
4. Review this documentation
5. Check GitHub issues for similar problems

Happy deploying! 🚀
