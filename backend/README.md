# FieldWatch Backend

Django REST Framework backend for the FieldWatch employee tracking system.

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL (for production)

### Installation

1. **Install dependencies**
```bash
pip install -r requirements.txt
```

2. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Database Setup**
```bash
python manage.py migrate
python manage.py createsuperuser  # Optional: create admin user
```

4. **Run Development Server**
```bash
python manage.py runserver 0.0.0.0:8000
```

## 📁 Project Structure

```
backend/
├── config/                 # Django project settings
│   ├── settings.py         # Main settings
│   ├── urls.py            # URL routing
│   └── wsgi.py            # WSGI configuration
├── apps/                   # Django applications
│   ├── authentication/    # User authentication
│   ├── guards/            # Guard management
│   ├── attendance/        # Attendance tracking
│   ├── tracking/          # Location tracking
│   └── reports/           # Analytics and alerts
├── requirements.txt       # Python dependencies
├── manage.py             # Django management script
└── Dockerfile            # Docker configuration
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost

# Database
POSTGRES_DB=fieldwatch_db
POSTGRES_USER=fieldwatch_user
POSTGRES_PASSWORD=fieldwatch_password
POSTGRES_HOST=db
POSTGRES_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Database Configuration

**Development (SQLite)**
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

**Production (PostgreSQL)**
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get("POSTGRES_DB"),
        'USER': os.environ.get("POSTGRES_USER"),
        'PASSWORD': os.environ.get("POSTGRES_PASSWORD"),
        'HOST': os.environ.get("POSTGRES_HOST"),
        'PORT': os.environ.get("POSTGRES_PORT"),
    }
}
```

## 📊 Database Models

### Authentication App
- **Organization**: Multi-tenant organization model
- **User**: Extended user model with organization and role

### Guards App
- **Guard**: Field staff profiles with contact and route information

### Attendance App
- **Attendance**: Check-in/out records with location and duration

### Tracking App
- **LocationLog**: GPS location history with timestamps

### Reports App
- **Alert**: System alerts with severity and resolution tracking

## 🔐 Authentication

The system uses JWT (JSON Web Tokens) for authentication:

- **Access Token**: Short-lived (5 minutes) for API requests
- **Refresh Token**: Long-lived (1 day) for token renewal
- **Role-based Access**: Admin, Manager, Guard roles

### Authentication Flow
1. User registers/logs in with credentials
2. Server returns access and refresh tokens
3. Client includes access token in Authorization header
4. Server validates token and processes request
5. Client refreshes token when expired

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `GET /api/auth/profile/` - Get user profile
- `POST /api/auth/token/refresh/` - Refresh JWT token

### Guards
- `GET /api/guards/` - List guards
- `POST /api/guards/` - Create guard
- `GET /api/guards/{id}/` - Get guard
- `PUT /api/guards/{id}/` - Update guard
- `DELETE /api/guards/{id}/` - Delete guard

### Attendance
- `GET /api/attendance/` - List attendance
- `GET /api/attendance/active/` - Active sessions
- `POST /api/attendance/checkin/` - Check-in
- `POST /api/attendance/checkout/{id}/` - Check-out
- `GET /api/attendance/export/` - Export CSV

### Tracking
- `GET /api/tracking/live/` - Live locations
- `POST /api/tracking/locations/` - Submit location
- `GET /api/tracking/guard/{id}/` - Guard history

### Reports
- `GET /api/reports/dashboard/` - Dashboard data
- `GET /api/reports/monthly/` - Monthly report
- `GET /api/reports/alerts/` - List alerts
- `POST /api/reports/alerts/` - Create alert
- `POST /api/reports/alerts/{id}/resolve/` - Resolve alert

## 🧪 Testing

Run tests with:
```bash
python manage.py test
```

Run specific app tests:
```bash
python manage.py test apps.authentication
python manage.py test apps.guards
```

## 📚 API Documentation

Access interactive API documentation:
- **Swagger UI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/
- **OpenAPI Schema**: http://localhost:8000/api/schema/

## 🚀 Deployment

### Development
```bash
python manage.py runserver 0.0.0.0:8000
```

### Production with Gunicorn
```bash
gunicorn --bind 0.0.0.0:8000 config.wsgi:application
```

### Docker
```bash
docker build -t fieldwatch-backend .
docker run -p 8000:8000 fieldwatch-backend
```

## 🔧 Management Commands

### Create Superuser
```bash
python manage.py createsuperuser
```

### Database Operations
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py dbshell
```

### Static Files
```bash
python manage.py collectstatic
```

## 🛠️ Development Tools

### Django Admin
Access at http://localhost:8000/admin/ with superuser credentials.

### Django Shell
```bash
python manage.py shell
```

### Database Shell
```bash
python manage.py dbshell
```

## 📦 Dependencies

Key packages:
- **Django 4.2.7**: Web framework
- **djangorestframework 3.14.0**: REST API framework
- **djangorestframework-simplejwt 5.3.0**: JWT authentication
- **django-cors-headers 4.3.1**: CORS handling
- **psycopg2-binary 2.9.7**: PostgreSQL adapter
- **drf-spectacular 0.26.5**: API documentation
- **gunicorn 21.2.0**: WSGI server
- **whitenoise 6.6.0**: Static file serving

## 🔒 Security

- JWT token authentication
- CORS protection
- Input validation via DRF serializers
- Role-based permissions
- Organization-level data isolation
- Secure password hashing

## 🐛 Troubleshooting

### Common Issues

**Migration Errors**
```bash
python manage.py makemigrations --empty appname
python manage.py migrate --fake-initial
```

**CORS Issues**
Check `CORS_ALLOWED_ORIGINS` in settings.py

**Database Connection**
Verify PostgreSQL is running and credentials are correct

**Import Errors**
Ensure all dependencies are installed:
```bash
pip install -r requirements.txt
```

## 📝 Contributing

1. Follow Django coding standards
2. Write tests for new features
3. Update API documentation
4. Use meaningful commit messages
5. Create pull requests for review

