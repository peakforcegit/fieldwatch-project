# FieldWatch - Real-time Employee Tracking System

FieldWatch is a comprehensive SaaS web application designed for real-time tracking and management of field staff including guards, delivery agents, and on-ground workforce. The system provides live location tracking, attendance management, alert systems, and detailed analytics.

## 🚀 Features

### Core Functionality
- **Real-time Location Tracking**: Live GPS tracking of field staff with map visualization
- **Attendance Management**: Check-in/check-out system with manual and automatic options
- **Alert System**: Configurable alerts for offline status, geofence violations, low battery, and panic situations
- **Analytics & Reporting**: Comprehensive dashboards with charts and exportable reports
- **Multi-tenant Architecture**: Organization-based separation with role-based access control

### User Roles
- **Admin**: Full system access, user management, organization settings
- **Manager**: Staff oversight, reports, alert management
- **Guard**: Mobile-friendly interface for check-ins and location sharing

### Technical Features
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **RESTful API**: Well-documented API with Swagger/OpenAPI documentation
- **Responsive Design**: Mobile-first design that works on all devices
- **Real-time Updates**: Live data updates for location and status information
- **Data Export**: CSV export for attendance records and analytics

## 🏗️ Architecture

### Backend (Django + DRF)
- **Framework**: Django 4.2.7 with Django REST Framework
- **Authentication**: JWT tokens with SimpleJWT
- **Database**: PostgreSQL (production) / SQLite (development)
- **API Documentation**: drf-spectacular (Swagger/OpenAPI)
- **CORS**: Configured for frontend integration

### Frontend (React + Vite)
- **Framework**: React 19 with Vite build tool
- **Styling**: Tailwind CSS with custom components
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React icons
- **Routing**: React Router DOM
- **State Management**: React Context API

### Database Schema
```
Organization
├── id, name, plan, created_at, updated_at

User (extends AbstractUser)
├── organization_id, role, phone, created_at, updated_at

Guard
├── name, phone, organization_id, user_id, assigned_route, is_active

LocationLog
├── guard_id, latitude, longitude, timestamp, accuracy, battery_level

Attendance
├── guard_id, checkin_time, checkout_time, checkin_method, checkout_method
├── checkin_lat/lng, checkout_lat/lng, notes

Alert
├── guard_id, alert_type, severity, message, is_resolved, resolved_at, resolved_by
```

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL (for production)

### Development Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd fieldwatch-project
```

2. **Backend Setup**
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

3. **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

4. **Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api
- API Documentation: http://localhost:8000/api/docs/

### Docker Setup

1. **Using Docker Compose**
```bash
docker-compose up --build
```

This will start:
- PostgreSQL database on port 5432
- Django backend on port 8000
- React frontend on port 3000

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `GET /api/auth/profile/` - Get user profile
- `POST /api/auth/token/refresh/` - Refresh JWT token

### Guards Management
- `GET /api/guards/` - List all guards
- `POST /api/guards/` - Create new guard
- `GET /api/guards/{id}/` - Get guard details
- `PUT /api/guards/{id}/` - Update guard
- `DELETE /api/guards/{id}/` - Delete guard

### Attendance
- `GET /api/attendance/` - List attendance records
- `GET /api/attendance/active/` - Get active attendances
- `POST /api/attendance/checkin/` - Check-in guard
- `POST /api/attendance/checkout/{id}/` - Check-out guard
- `GET /api/attendance/export/` - Export attendance CSV

### Location Tracking
- `GET /api/tracking/live/` - Get live guard locations
- `POST /api/tracking/locations/` - Submit location data
- `GET /api/tracking/guard/{id}/` - Get guard location history

### Reports & Analytics
- `GET /api/reports/dashboard/` - Dashboard analytics
- `GET /api/reports/monthly/` - Monthly performance report
- `GET /api/reports/alerts/` - List alerts
- `POST /api/reports/alerts/` - Create alert
- `POST /api/reports/alerts/{id}/resolve/` - Resolve alert

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost
POSTGRES_DB=fieldwatch_db
POSTGRES_USER=fieldwatch_user
POSTGRES_PASSWORD=fieldwatch_password
POSTGRES_HOST=db
POSTGRES_PORT=5432
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

**Frontend (.env)**
```
VITE_API_URL=http://localhost:8000/api
```

## 📊 Features Overview

### Dashboard
- Real-time guard status overview
- Weekly attendance trends
- Alert distribution charts
- Live location map
- Quick action buttons

### Guard Management
- CRUD operations for guard profiles
- Route assignment
- Status management
- Contact information

### Attendance Tracking
- Manual and automatic check-in/out
- Duration calculation
- Location-based attendance
- Export functionality

### Alert System
- Multiple alert types (offline, geofence, battery, panic)
- Severity levels (low, medium, high, critical)
- Resolution tracking
- Real-time notifications

### Reports & Analytics
- Monthly performance reports
- Guard productivity metrics
- Attendance statistics
- Alert summaries
- Exportable data

## 🔒 Security Features

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- CORS protection
- Input validation and sanitization
- Secure password handling
- Organization-level data isolation

## 📱 Mobile Compatibility

The application is designed with mobile-first principles:
- Responsive design for all screen sizes
- Touch-friendly interface
- Optimized for field staff usage
- Progressive Web App (PWA) ready

## 🚀 Deployment

### Production Deployment

1. **Backend Deployment** (Railway/Render/VPS)
```bash
# Update settings for production
# Set environment variables
# Run migrations
python manage.py migrate
python manage.py collectstatic
gunicorn config.wsgi:application
```

2. **Frontend Deployment** (Vercel/Netlify)
```bash
npm run build
# Deploy dist/ folder
```

### Docker Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
python manage.py test
```

### Frontend Tests
```bash
cd frontend
npm run test
```

## 📚 API Documentation

Complete API documentation is available at:
- Swagger UI: http://localhost:8000/api/docs/
- ReDoc: http://localhost:8000/api/redoc/
- OpenAPI Schema: http://localhost:8000/api/schema/

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the API documentation
- Review the troubleshooting guide
- Submit an issue on GitHub

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
  - User authentication and authorization
  - Guard management system
  - Real-time location tracking
  - Attendance management
  - Alert system
  - Analytics dashboard
  - Mobile-responsive design

---

Built with ❤️ for efficient field staff management.

