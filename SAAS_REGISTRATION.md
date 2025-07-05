# FieldWatch SaaS Registration System

## Overview
FieldWatch is a multi-tenant SaaS platform for real-time field staff tracking and management. This document explains how new companies can register and start using the service.

## Registration Flow

### 1. Landing Page
- New visitors see a professional landing page at `/` explaining the service
- Clear call-to-action buttons for "Get Started" (register) and "Sign In" (login)

### 2. Company Registration
- Companies visit `/register` to create their organization account
- Required fields:
  - Company/Organization Name
  - Admin user details (name, email, username, password)
  - Optional: phone number
- The first user is automatically assigned the "admin" role

### 3. Organization Creation
- Each registration creates a new Organization in the database
- Complete data isolation between organizations (multi-tenant)
- Admin user is automatically associated with the new organization

### 4. Post-Registration
- After successful registration, users are redirected to login
- Admin can then log in and access the dashboard
- Admin can create additional users (managers, guards) within their organization

## User Roles

### Admin
- Can register new companies (first user)
- Full access to all features
- Can create and manage other users (managers, guards)
- Access to user management dashboard
- Company statistics and reports

### Manager
- Created by admin within their organization
- Can view team members and their activities
- Access to attendance and location data
- Can manage alerts and reports

### Guard
- Created by admin within their organization
- Mobile-focused interface
- Check-in/out functionality
- Live location sharing
- Alert reporting

## Technical Implementation

### Frontend
- `Landing.jsx` - Professional landing page
- `Register.jsx` - Company registration form
- `Login.jsx` - User authentication
- Role-based routing and access control

### Backend
- `RegisterSerializer` - Handles organization and user creation
- Multi-tenant architecture with organization-based data isolation
- JWT authentication for secure access
- Role-based permissions

### Database
- `Organization` model for company isolation
- `User` model with role and organization foreign keys
- All data models include organization references

## Security Features

- JWT token-based authentication
- Role-based access control (RBAC)
- Multi-tenant data isolation
- Secure password handling
- Token refresh mechanism

## Getting Started for New Companies

1. **Visit the landing page** - Learn about FieldWatch features
2. **Click "Get Started"** - Navigate to registration
3. **Fill company details** - Provide organization and admin information
4. **Verify email** - Confirm registration (if email verification is enabled)
5. **Login** - Access the admin dashboard
6. **Add team members** - Create manager and guard accounts
7. **Start tracking** - Begin monitoring field staff

## API Endpoints

- `POST /auth/register/` - Company registration
- `POST /auth/login/` - User authentication
- `GET /auth/profile/` - User profile information
- `POST /auth/token/refresh/` - Token refresh
- `GET/POST /auth/users/` - User management (admin only)

## Deployment Notes

- Ensure proper CORS configuration for frontend-backend communication
- Set up environment variables for JWT secrets
- Configure database for multi-tenant support
- Set up proper SSL/TLS for production use
- Consider email verification for additional security

## Support

For technical support or questions about the registration system, contact the development team or refer to the main project documentation. 