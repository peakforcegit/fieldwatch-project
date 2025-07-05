# FieldWatch Deployment Guide

This guide covers various deployment options for the FieldWatch application.

## 🚀 Quick Deployment Options

### Option 1: Docker Compose (Recommended for Development)

1. **Prerequisites**
   - Docker and Docker Compose installed
   - Git for cloning the repository

2. **Deploy**
   ```bash
   git clone <repository-url>
   cd fieldwatch-project
   docker-compose up --build -d
   ```

3. **Access**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000
   - API Docs: http://localhost:8000/api/docs/

### Option 2: Separate Deployments

#### Backend Deployment (Railway/Render/Heroku)

1. **Prepare for Production**
   ```bash
   cd backend
   # Update settings.py for production database
   # Set environment variables
   ```

2. **Environment Variables**
   ```
   SECRET_KEY=your-production-secret-key
   DEBUG=False
   ALLOWED_HOSTS=your-domain.com
   POSTGRES_DB=fieldwatch_prod
   POSTGRES_USER=fieldwatch_user
   POSTGRES_PASSWORD=secure-password
   POSTGRES_HOST=your-db-host
   POSTGRES_PORT=5432
   CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
   ```

3. **Deploy Commands**
   ```bash
   python manage.py migrate
   python manage.py collectstatic --noinput
   gunicorn config.wsgi:application
   ```

#### Frontend Deployment (Vercel/Netlify)

1. **Build for Production**
   ```bash
   cd frontend
   npm run build
   ```

2. **Environment Variables**
   ```
   VITE_API_URL=https://your-backend-domain.com/api
   ```

3. **Deploy**
   - Upload `dist/` folder to your hosting service
   - Configure build command: `npm run build`
   - Configure output directory: `dist`

## 🐳 Docker Production Deployment

### Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: fieldwatch_prod
      POSTGRES_USER: fieldwatch_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile.prod
    environment:
      - DEBUG=False
      - SECRET_KEY=${SECRET_KEY}
      - POSTGRES_DB=fieldwatch_prod
      - POSTGRES_USER=fieldwatch_user
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_HOST=db
      - ALLOWED_HOSTS=${ALLOWED_HOSTS}
      - CORS_ALLOWED_ORIGINS=${CORS_ALLOWED_ORIGINS}
    depends_on:
      - db
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    environment:
      - VITE_API_URL=${VITE_API_URL}
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
    restart: unless-stopped

volumes:
  postgres_data:
```

### Production Dockerfiles

**Backend Dockerfile.prod**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "config.wsgi:application"]
```

**Frontend Dockerfile.prod**
```dockerfile
FROM node:20-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## ☁️ Cloud Platform Deployments

### Railway Deployment

1. **Backend on Railway**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login and deploy
   railway login
   cd backend
   railway init
   railway up
   ```

2. **Environment Variables**
   Set in Railway dashboard:
   - `SECRET_KEY`
   - `DEBUG=False`
   - `ALLOWED_HOSTS`
   - Database variables (Railway provides PostgreSQL)

### Render Deployment

1. **Backend on Render**
   - Connect GitHub repository
   - Set build command: `pip install -r requirements.txt`
   - Set start command: `gunicorn config.wsgi:application`
   - Add PostgreSQL database service

2. **Frontend on Render**
   - Connect GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`

### Vercel + Railway

1. **Backend on Railway**
   ```bash
   cd backend
   railway init
   railway up
   ```

2. **Frontend on Vercel**
   ```bash
   cd frontend
   vercel --prod
   ```

## 🔧 Production Configuration

### Backend Production Settings

Update `settings.py` for production:

```python
import os
from decouple import config

DEBUG = config('DEBUG', default=False, cast=bool)
SECRET_KEY = config('SECRET_KEY')
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='').split(',')

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('POSTGRES_DB'),
        'USER': config('POSTGRES_USER'),
        'PASSWORD': config('POSTGRES_PASSWORD'),
        'HOST': config('POSTGRES_HOST'),
        'PORT': config('POSTGRES_PORT', default=5432),
    }
}

# Security
SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=False, cast=bool)
SECURE_HSTS_SECONDS = config('SECURE_HSTS_SECONDS', default=0, cast=int)
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Static files
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```

### Frontend Production Build

Update `vite.config.js`:

```javascript
export default {
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          charts: ['recharts']
        }
      }
    }
  }
}
```

## 🔒 Security Configuration

### SSL/HTTPS Setup

1. **Obtain SSL Certificate**
   - Let's Encrypt (free)
   - CloudFlare (free)
   - Commercial certificate

2. **Nginx Configuration**
   ```nginx
   server {
       listen 443 ssl;
       server_name your-domain.com;
       
       ssl_certificate /etc/nginx/ssl/cert.pem;
       ssl_certificate_key /etc/nginx/ssl/key.pem;
       
       location /api/ {
           proxy_pass http://backend:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
       
       location / {
           proxy_pass http://frontend:80;
           proxy_set_header Host $host;
       }
   }
   ```

### Environment Security

1. **Use Environment Variables**
   - Never commit secrets to git
   - Use `.env` files for local development
   - Use platform environment variables for production

2. **Database Security**
   - Use strong passwords
   - Enable SSL connections
   - Restrict network access
   - Regular backups

## 📊 Monitoring & Logging

### Application Monitoring

1. **Backend Logging**
   ```python
   LOGGING = {
       'version': 1,
       'disable_existing_loggers': False,
       'handlers': {
           'file': {
               'level': 'INFO',
               'class': 'logging.FileHandler',
               'filename': 'django.log',
           },
       },
       'loggers': {
           'django': {
               'handlers': ['file'],
               'level': 'INFO',
               'propagate': True,
           },
       },
   }
   ```

2. **Error Tracking**
   - Sentry integration
   - Custom error handlers
   - Performance monitoring

### Health Checks

1. **Backend Health Check**
   ```python
   # Add to urls.py
   path('health/', lambda request: JsonResponse({'status': 'ok'}))
   ```

2. **Database Health Check**
   ```python
   from django.db import connection
   
   def health_check(request):
       try:
           connection.ensure_connection()
           return JsonResponse({'status': 'ok', 'database': 'connected'})
       except Exception as e:
           return JsonResponse({'status': 'error', 'database': str(e)})
   ```

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy FieldWatch

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway login --token ${{ secrets.RAILWAY_TOKEN }}
          railway up --service backend

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        run: |
          npm install -g vercel
          cd frontend
          vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

## 📋 Pre-Deployment Checklist

### Backend Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Static files collected
- [ ] CORS settings updated
- [ ] SSL certificate installed
- [ ] Health checks working
- [ ] Logging configured

### Frontend Checklist
- [ ] API URL updated
- [ ] Build optimization enabled
- [ ] Error boundaries implemented
- [ ] Performance monitoring setup
- [ ] PWA configuration (if needed)
- [ ] SEO meta tags added

### Security Checklist
- [ ] Debug mode disabled
- [ ] Secret keys rotated
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation implemented

## 🚨 Troubleshooting

### Common Deployment Issues

1. **Database Connection Errors**
   - Check connection string
   - Verify firewall settings
   - Test database connectivity

2. **CORS Errors**
   - Update `CORS_ALLOWED_ORIGINS`
   - Check frontend API URL
   - Verify protocol (http/https)

3. **Static Files Not Loading**
   - Run `collectstatic`
   - Check `STATIC_ROOT` setting
   - Verify web server configuration

4. **Build Failures**
   - Check Node.js version
   - Clear node_modules and reinstall
   - Verify environment variables

### Performance Issues

1. **Slow API Responses**
   - Add database indexes
   - Implement caching
   - Optimize queries

2. **Large Bundle Size**
   - Enable code splitting
   - Remove unused dependencies
   - Optimize images

## 📞 Support

For deployment support:
1. Check the troubleshooting section
2. Review platform-specific documentation
3. Submit an issue with deployment logs
4. Contact support team

---

This deployment guide covers the most common scenarios. Choose the option that best fits your infrastructure and requirements.

