# Deployment Guide

## Firebase Hosting Deployment

This project is configured for deployment to Firebase Hosting with optimized settings for production.

### Prerequisites

1. **Firebase CLI**: Already installed and authenticated
2. **Firebase Project**: `stage-timer-d97b9` is configured
3. **Environment Variables**: Production Firebase config in `.env`

### Manual Deployment

#### Quick Deploy
```bash
npm run deploy
```

#### Step-by-Step Deploy
```bash
# 1. Build for production
npm run build:prod

# 2. Deploy to Firebase Hosting
firebase deploy --only hosting
```

#### Preview Deploy
```bash
# Deploy to a preview channel
npm run deploy:preview
```

#### Local Testing
```bash
# Test the built app locally
npm run firebase:serve

# Or use Firebase emulators
npm run firebase:emulators
```

### Automated Deployment (GitHub Actions)

The project includes a GitHub Actions workflow that automatically:

1. **On Pull Requests**: Deploys to a preview channel
2. **On Main/Master Push**: Deploys to production

#### Setup GitHub Actions

1. **Add Firebase Service Account**:
   ```bash
   # Generate service account key
   firebase init hosting:github
   ```

2. **Add Secrets to GitHub Repository**:
   - `FIREBASE_SERVICE_ACCOUNT_STAGE_TIMER_D97B9`
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

### Production Optimizations

The build is optimized for:

- **Performance**: Code splitting, tree shaking, minification
- **Caching**: Static assets cached for 1 year, HTML not cached
- **Security**: Security headers, no source maps
- **SEO**: Clean URLs, proper meta tags
- **Smart TV Compatibility**: Modern ES2020 target

### Firebase Hosting Features

- **SPA Routing**: All routes redirect to index.html
- **Custom Headers**: Security and caching headers
- **Clean URLs**: No .html extensions
- **HTTPS**: Automatic SSL certificates
- **CDN**: Global content delivery network

### Monitoring

After deployment, monitor your app at:
- **Production**: https://stage-timer-d97b9.web.app
- **Firebase Console**: https://console.firebase.google.com/project/stage-timer-d97b9

### Troubleshooting

#### Build Issues
```bash
# Clear cache and rebuild
npm run clear-cache
npm install
npm run build:prod
```

#### Deployment Issues
```bash
# Check Firebase login
firebase login

# Verify project
firebase projects:list

# Check hosting status
firebase hosting:sites:list
```

#### Environment Variables
Ensure all required environment variables are set in production:
- Check `.env` file for development
- Check GitHub Secrets for CI/CD
- Verify Firebase project configuration
