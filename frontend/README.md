# FieldWatch Frontend

React frontend application for the FieldWatch employee tracking system.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm or pnpm

### Installation

1. **Install dependencies**
```bash
npm install
# or
pnpm install
```

2. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your API URL
```

3. **Start Development Server**
```bash
npm run dev
# or
pnpm dev
```

4. **Access Application**
Open http://localhost:3000 in your browser

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/         # Reusable UI components
│   │   └── Layout.jsx     # Main layout wrapper
│   ├── pages/             # Page components
│   │   ├── Login.jsx      # Authentication page
│   │   ├── Dashboard.jsx  # Main dashboard
│   │   ├── Guards.jsx     # Guard management
│   │   ├── Attendance.jsx # Attendance tracking
│   │   ├── Reports.jsx    # Analytics and reports
│   │   └── Alerts.jsx     # Alert management
│   ├── context/           # React Context providers
│   │   └── AuthContext.jsx # Authentication state
│   ├── services/          # API service layer
│   │   └── api.js         # HTTP client and API calls
│   ├── App.jsx           # Main application component
│   ├── main.jsx          # Application entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── package.json          # Dependencies and scripts
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind CSS configuration
└── Dockerfile           # Docker configuration
```

## 🎨 Tech Stack

### Core Technologies
- **React 19**: UI library with hooks and context
- **Vite**: Fast build tool and dev server
- **React Router DOM**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework

### UI Components
- **Radix UI**: Accessible component primitives
- **Lucide React**: Beautiful icon library
- **Recharts**: Responsive chart library
- **React Hook Form**: Form handling and validation

### State Management
- **React Context**: Global state management
- **Local State**: Component-level state with hooks

## 🔧 Configuration

### Environment Variables

Create a `.env` file:
```env
VITE_API_URL=http://localhost:8000/api
```

### Vite Configuration

```javascript
// vite.config.js
export default {
  server: {
    host: '0.0.0.0',
    port: 3000
  },
  build: {
    outDir: 'dist'
  }
}
```

## 🎯 Features

### Authentication
- Login and registration forms
- JWT token management
- Automatic token refresh
- Protected routes
- Role-based access

### Dashboard
- Real-time statistics
- Interactive charts
- Live guard locations
- Quick action buttons
- Responsive layout

### Guard Management
- CRUD operations
- Search and filtering
- Contact information
- Route assignments
- Status indicators

### Attendance Tracking
- Check-in/out interface
- Duration calculations
- Export functionality
- Filter options
- Real-time updates

### Reports & Analytics
- Monthly performance reports
- Guard productivity metrics
- Interactive charts
- Data visualization
- Export capabilities

### Alert System
- Alert creation and management
- Severity indicators
- Resolution tracking
- Real-time notifications
- Filter and search

## 🔐 Authentication Flow

### Login Process
1. User enters credentials
2. API call to `/api/auth/login/`
3. Store JWT tokens in localStorage
4. Update authentication context
5. Redirect to dashboard

### Token Management
- Access tokens included in API requests
- Automatic refresh on expiration
- Logout clears stored tokens
- Protected routes check authentication

### API Service
```javascript
// Automatic token refresh
const response = await fetch(url, {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

if (response.status === 401) {
  await refreshToken();
  // Retry request
}
```

## 📱 Responsive Design

### Mobile-First Approach
- Tailwind CSS breakpoints
- Touch-friendly interfaces
- Optimized for field staff
- Progressive Web App ready

### Breakpoints
- `sm`: 640px and up
- `md`: 768px and up
- `lg`: 1024px and up
- `xl`: 1280px and up

## 🎨 Styling

### Tailwind CSS
Utility-first CSS framework with custom configuration:

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981'
      }
    }
  }
}
```

### Component Styling
- Consistent color scheme
- Hover and focus states
- Loading indicators
- Error states
- Success feedback

## 📊 Data Visualization

### Recharts Integration
- Line charts for trends
- Bar charts for comparisons
- Pie charts for distributions
- Responsive containers
- Custom tooltips

### Chart Components
```jsx
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip />
    <Line type="monotone" dataKey="count" stroke="#3B82F6" />
  </LineChart>
</ResponsiveContainer>
```

## 🔄 State Management

### Authentication Context
```jsx
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Authentication methods
  const login = async (credentials) => { /* ... */ };
  const logout = () => { /* ... */ };
  
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

## 🧪 Testing

### Run Tests
```bash
npm run test
# or
pnpm test
```

### Test Structure
- Component tests
- Integration tests
- API service tests
- Authentication flow tests

## 🚀 Build & Deployment

### Development Build
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Docker Deployment
```bash
docker build -t fieldwatch-frontend .
docker run -p 3000:3000 fieldwatch-frontend
```

## 📦 Dependencies

### Core Dependencies
- **react**: UI library
- **react-dom**: DOM rendering
- **react-router-dom**: Routing
- **@tailwindcss/vite**: Tailwind integration

### UI Components
- **@radix-ui/react-***: Accessible components
- **lucide-react**: Icons
- **recharts**: Charts
- **react-hook-form**: Forms

### Development Dependencies
- **vite**: Build tool
- **eslint**: Code linting
- **@vitejs/plugin-react**: React plugin

## 🔧 Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint ."
  }
}
```

## 🐛 Troubleshooting

### Common Issues

**API Connection Errors**
- Check `VITE_API_URL` in `.env`
- Verify backend is running
- Check CORS configuration

**Build Errors**
```bash
rm -rf node_modules
npm install
npm run build
```

**Styling Issues**
- Verify Tailwind CSS is properly configured
- Check for conflicting CSS
- Clear browser cache

**Authentication Issues**
- Check token expiration
- Verify API endpoints
- Clear localStorage

## 🎯 Performance Optimization

### Code Splitting
- Route-based splitting
- Lazy loading components
- Dynamic imports

### Bundle Optimization
- Tree shaking
- Minification
- Asset optimization

### Caching
- Browser caching
- Service worker (PWA)
- API response caching

## 📱 Progressive Web App

### PWA Features
- Offline functionality
- App-like experience
- Push notifications
- Install prompts

### Service Worker
```javascript
// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

## 🔒 Security

### Best Practices
- Secure token storage
- XSS protection
- CSRF protection
- Input validation
- Secure API communication

## 📝 Contributing

1. Follow React best practices
2. Use TypeScript for new features
3. Write component tests
4. Follow naming conventions
5. Update documentation
6. Create pull requests

## 🎨 Design System

### Colors
- Primary: Blue (#3B82F6)
- Success: Green (#10B981)
- Warning: Yellow (#F59E0B)
- Error: Red (#EF4444)

### Typography
- Headings: Font weight 600-700
- Body: Font weight 400
- Captions: Font weight 300

### Spacing
- Consistent 4px grid
- Tailwind spacing scale
- Responsive margins/padding

