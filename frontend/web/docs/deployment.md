# Deployment

This guide covers deploying the GlobalBank React template to various hosting platforms, build optimization, environment configuration, and production best practices.

## Table of Contents

- [Build Process](#build-process)
- [Environment Configuration](#environment-configuration)
- [Deployment Platforms](#deployment-platforms)
- [Domain Configuration](#domain-configuration)
- [Performance Optimization](#performance-optimization)
- [Security Considerations](#security-considerations)
- [Monitoring and Analytics](#monitoring-and-analytics)
- [Continuous Deployment](#continuous-deployment)

## Build Process

### Production Build

The template uses Vite for building. Create a production build:

```bash
# Install dependencies
npm install

# Create production build
npm run build
```

This generates a `dist/` folder with optimized assets:

```
dist/
├── assets/
│   ├── index-[hash].js      # Main JavaScript bundle
│   ├── index-[hash].css     # Compiled CSS
│   └── [other-assets]       # Images, fonts, etc.
├── images/                  # Static images
├── index.html              # Main HTML file
└── [other-static-files]    # Favicon, etc.
```

### Build Configuration

Customize the build in `vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      // ... other aliases
    }
  },
  build: {
    // Customize build output
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Set to true for debugging in production
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom']
        }
      }
    }
  }
})
```

### Build Optimization

```js
// Advanced build configuration
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react')) {
              return 'react-vendor';
            }
            return 'vendor';
          }

          // Feature-based chunks
          if (id.includes('src/features/')) {
            const feature = id.split('src/features/')[1].split('/')[0];
            return `feature-${feature}`;
          }
        }
      }
    },
    target: 'es2015', // Browser compatibility
    cssCodeSplit: true, // Split CSS files
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      }
    }
  }
})
```

## Environment Configuration

### Environment Variables

Create environment files for different stages:

```bash
# .env.local (local development)
VITE_API_URL=http://localhost:3001
VITE_ANALYTICS_ID=dev-analytics-id
VITE_APP_ENV=development

# .env.production (production)
VITE_API_URL=https://api.yourdomain.com
VITE_ANALYTICS_ID=prod-analytics-id
VITE_APP_ENV=production

# .env.staging (staging)
VITE_API_URL=https://api-staging.yourdomain.com
VITE_ANALYTICS_ID=staging-analytics-id
VITE_APP_ENV=staging
```

### Using Environment Variables

```jsx
// src/config/env.js
export const config = {
  apiUrl: import.meta.env.VITE_API_URL,
  analyticsId: import.meta.env.VITE_ANALYTICS_ID,
  environment: import.meta.env.VITE_APP_ENV,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD
};

// Usage in components
import { config } from '@config/env';

function ApiService() {
  const apiUrl = config.apiUrl;
  // ... rest of service
}
```

### Build-Specific Configuration

```jsx
// src/config/app-config.js
const config = {
  development: {
    apiUrl: 'http://localhost:3001',
    enableDevTools: true,
    logLevel: 'debug'
  },
  production: {
    apiUrl: 'https://api.yourdomain.com',
    enableDevTools: false,
    logLevel: 'error'
  }
};

export default config[import.meta.env.VITE_APP_ENV] || config.development;
```

## Deployment Platforms

### Vercel (Recommended)

Vercel provides excellent support for React applications with automatic deployments.

#### Setup

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   # First deployment
   vercel

   # Production deployment
   vercel --prod
   ```

3. **Configuration** (`vercel.json`):
   ```json
   {
     "builds": [
       {
         "src": "package.json",
         "use": "@vercel/static-build",
         "config": {
           "distDir": "dist"
         }
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/index.html"
       }
     ],
     "env": {
       "VITE_API_URL": "@api-url"
     }
   }
   ```

#### Environment Variables in Vercel

1. Go to your project dashboard
2. Navigate to Settings → Environment Variables
3. Add your environment variables:
   - `VITE_API_URL`
   - `VITE_ANALYTICS_ID`
   - etc.

### Netlify

Netlify offers easy deployment with continuous integration.

#### Setup

1. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`

2. **Configuration** (`netlify.toml`):
   ```toml
   [build]
     publish = "dist"
     command = "npm run build"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200

   [build.environment]
     NODE_VERSION = "18"
   ```

3. **Deploy**:
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli

   # Build and deploy
   npm run build
   netlify deploy --dir=dist --prod
   ```

### GitHub Pages

For simple static hosting:

#### Setup

1. **Install gh-pages**:
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Update package.json**:
   ```json
   {
     "homepage": "https://yourusername.github.io/your-repo-name",
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. **Deploy**:
   ```bash
   npm run deploy
   ```

#### Vite Configuration for GitHub Pages

```js
// vite.config.js
export default defineConfig({
  base: '/your-repo-name/', // GitHub repository name
  // ... other config
})
```

### AWS S3 + CloudFront

For enterprise-grade hosting:

#### S3 Bucket Setup

1. Create S3 bucket
2. Enable static website hosting
3. Upload `dist/` contents
4. Configure bucket policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

#### CloudFront Distribution

1. Create CloudFront distribution
2. Set origin to S3 bucket
3. Configure custom error pages for SPA routing:
   - Error Code: 403, 404
   - Response Page Path: `/index.html`
   - HTTP Response Code: 200

#### Deployment Script

```bash
#!/bin/bash
# deploy-aws.sh

# Build the project
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

### Docker Deployment

For containerized deployment:

#### Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf

```nginx
events {
  worker_connections 1024;
}

http {
  include /etc/nginx/mime.types;
  default_type application/octet-stream;

  server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Handle client-side routing
    location / {
      try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
      expires 1y;
      add_header Cache-Control "public, immutable";
    }
  }
}
```

#### Build and Run

```bash
# Build Docker image
docker build -t globalbank-app .

# Run container
docker run -p 80:80 globalbank-app
```

## Domain Configuration

### Custom Domain Setup

#### DNS Configuration

1. **A Record**: Point to your hosting provider's IP
2. **CNAME Record**: Point subdomain to hosting provider

Example DNS records:
```
Type    Name    Value
A       @       192.0.2.1
A       www     192.0.2.1
CNAME   app     your-app.vercel.app
```

#### SSL Certificate

Most platforms provide automatic SSL certificates:

- **Vercel**: Automatic SSL with Let's Encrypt
- **Netlify**: Automatic SSL with Let's Encrypt
- **CloudFront**: Use AWS Certificate Manager

### Subdomain Configuration

For multi-environment setup:

```
https://yourdomain.com          # Production
https://staging.yourdomain.com  # Staging
https://dev.yourdomain.com      # Development
```

## Performance Optimization

### Build Optimization

```js
// vite.config.js - Production optimizations
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info']
      }
    },
    cssMinify: true,
    reportCompressedSize: false, // Faster builds
    chunkSizeWarningLimit: 1000 // Increase if needed
  }
})
```

### CDN Configuration

#### Asset CDN

```js
// Upload assets to CDN and update references
const assetsCDN = 'https://cdn.yourdomain.com';

// In build process, replace asset URLs
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['react', 'react-dom'], // Use CDN versions
      output: {
        paths: {
          react: `${assetsCDN}/react@18/umd/react.production.min.js`,
          'react-dom': `${assetsCDN}/react-dom@18/umd/react-dom.production.min.js`
        }
      }
    }
  }
})
```

### Preloading and Prefetching

```html
<!-- In index.html -->
<head>
  <!-- Preload critical resources -->
  <link rel="preload" href="/fonts/main-font.woff2" as="font" type="font/woff2" crossorigin>

  <!-- Prefetch next likely pages -->
  <link rel="prefetch" href="/about">
  <link rel="prefetch" href="/pricing">

  <!-- Preconnect to external domains -->
  <link rel="preconnect" href="https://api.yourdomain.com">
  <link rel="preconnect" href="https://analytics.google.com">
</head>
```

## Security Considerations

### Environment Security

```bash
# Never commit sensitive environment variables
# Use .env.local for local secrets (already in .gitignore)

# .env.local (not committed)
VITE_STRIPE_SECRET_KEY=sk_live_...
VITE_DATABASE_URL=postgres://...
```

### Content Security Policy

```html
<!-- Add to index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://analytics.google.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self' https://api.yourdomain.com;
">
```

### Secure Headers

```js
// For server-side configuration (nginx/apache)
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};
```

## Monitoring and Analytics

### Google Analytics

```jsx
// src/utils/analytics.js
import { config } from '@config/env';

export const gtag = (...args) => {
  if (config.isProduction && window.gtag) {
    window.gtag(...args);
  }
};

// Track page views
export const trackPageView = (url) => {
  gtag('config', config.analyticsId, {
    page_path: url,
  });
};

// Track events
export const trackEvent = (action, category, label, value) => {
  gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};
```

```jsx
// Usage in router
import { trackPageView } from '@utils/analytics';

function App() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location]);

  return <Router />;
}
```

### Error Monitoring

```jsx
// src/utils/error-monitoring.js
export const logError = (error, errorInfo) => {
  if (config.isProduction) {
    // Send to error monitoring service
    console.error('Application error:', error, errorInfo);
  }
};

// In error boundary
class ErrorBoundary extends Component {
  componentDidCatch(error, errorInfo) {
    logError(error, errorInfo);
  }
}
```

### Performance Monitoring

```jsx
// src/utils/performance.js
export const measurePerformance = (name, fn) => {
  if (config.isProduction) {
    performance.mark(`${name}-start`);
    const result = fn();
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);

    // Report to analytics
    const measure = performance.getEntriesByName(name)[0];
    trackEvent('performance', name, 'duration', Math.round(measure.duration));

    return result;
  }
  return fn();
};
```

## Continuous Deployment

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run tests
      run: npm test

    - name: Build application
      run: npm run build
      env:
        VITE_API_URL: ${{ secrets.VITE_API_URL }}
        VITE_ANALYTICS_ID: ${{ secrets.VITE_ANALYTICS_ID }}

    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

### Deployment Checklist

#### Pre-deployment

- [ ] Run tests locally: `npm test`
- [ ] Build successfully: `npm run build`
- [ ] Check for console errors
- [ ] Verify environment variables
- [ ] Test responsive design
- [ ] Validate accessibility
- [ ] Check SEO meta tags

#### Post-deployment

- [ ] Verify site loads correctly
- [ ] Test all routes work
- [ ] Check form submissions
- [ ] Verify analytics tracking
- [ ] Test mobile responsiveness
- [ ] Check performance metrics
- [ ] Verify SSL certificate

### Rollback Strategy

```bash
# Keep deployment backups
npm run build
cp -r dist dist-backup-$(date +%Y%m%d-%H%M%S)

# Quick rollback script
#!/bin/bash
# rollback.sh
BACKUP_DIR=$1
if [ -z "$BACKUP_DIR" ]; then
  echo "Usage: ./rollback.sh <backup-directory>"
  exit 1
fi

rm -rf dist
cp -r $BACKUP_DIR dist
# Deploy the backup
```

## Troubleshooting Deployment

### Common Issues

1. **Build fails**: Check Node.js version compatibility
2. **Routes not working**: Configure SPA fallback to `index.html`
3. **Assets not loading**: Check base URL configuration
4. **Environment variables not working**: Verify variable names start with `VITE_`

### Debug Commands

```bash
# Check build output
npm run build && ls -la dist/

# Test production build locally
npm run preview

# Check bundle size
npm run build && du -sh dist/*

# Analyze bundle
npx vite-bundle-analyzer dist/assets/*.js
```

## Next Steps

- **[Monitor performance](loading-and-performance.md)** - Set up performance monitoring
- **[Configure analytics](troubleshooting.md)** - Track user behavior
- **[Set up CI/CD](troubleshooting.md)** - Automate deployments
- **[Optimize for SEO](troubleshooting.md)** - Improve search engine visibility