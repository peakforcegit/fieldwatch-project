import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, UserCheck, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import api from '../services/api';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';

// Custom marker icon to fix default icon issue in leaflet
const guardIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
});

function FitBounds({ locations }) {
  const map = useMap();
  useEffect(() => {
    if (locations.length === 1) {
      map.setView([
        parseFloat(locations[0].latitude),
        parseFloat(locations[0].longitude)
      ], 15);
    } else if (locations.length > 1) {
      const bounds = locations.map(loc => [parseFloat(loc.latitude), parseFloat(loc.longitude)]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations, map]);
  return null;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    managers: 0,
    guards: 0,
    activeAttendances: 0,
    recentAlerts: 0
  });
  const [loading, setLoading] = useState(true);
  const [guardLocations, setGuardLocations] = useState([]);
  const [mapLoading, setMapLoading] = useState(false);
  const [pendingCheckouts, setPendingCheckouts] = useState([]);

  // Initial stats and locations fetch (on mount or user change)
  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'manager') {
      fetchPendingCheckouts();
    }
    if (user?.role === 'admin') {
      fetchAdminStats();
      fetchGuardLocations(); // initial fetch
    } else {
      setLoading(false);
    }
  }, [user]);

  // Poll only guard locations every 30s (no page reload)
  useEffect(() => {
    if (user?.role === 'admin') {
      const interval = setInterval(fetchGuardLocations, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchPendingCheckouts = async () => {
    try {
      const res = await api.get('/attendance/active/');
      setPendingCheckouts(res || []);
    } catch (err) {
      setPendingCheckouts([]);
    }
  };

  const fetchAdminStats = async () => {
    try {
      const [usersRes, attendanceRes, alertsRes] = await Promise.all([
        api.get('/auth/users/'),
        api.get('/attendance/active/'),
        api.get('/reports/alerts/')
      ]);

      const users = usersRes || [];
      const managers = users.filter(u => u.role === 'manager').length;
      const guards = users.filter(u => u.role === 'guard').length;

      setStats({
        totalUsers: users.length,
        managers,
        guards,
        activeAttendances: attendanceRes?.length || 0,
        recentAlerts: alertsRes?.length || 0
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Only set mapLoading for map section, not for the whole page
  const fetchGuardLocations = async () => {
    setMapLoading(true);
    try {
      const res = await api.get('/tracking/live-locations/');
      setGuardLocations(res || []);
    } catch (err) {
      setGuardLocations([]);
    } finally {
      setMapLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // In-app alert for pending check-outs (admin/manager)
  const showPendingCheckoutAlert = (user?.role === 'admin' || user?.role === 'manager') && pendingCheckouts.length > 0;

  if (user?.role === 'admin') {
    return (
      <div className="space-y-6 px-2 sm:px-4 md:px-8 lg:px-16 xl:px-32">
        {showPendingCheckoutAlert && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Pending Check-outs</AlertTitle>
            <AlertDescription>
              {pendingCheckouts.length} guard(s) have not checked out yet. Please review active attendances.
            </AlertDescription>
          </Alert>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your organization's activity and statistics
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalUsers}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserCheck className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Managers</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.managers}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Guards</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.guards}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Check-ins</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.activeAttendances}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <div className="px-2 sm:px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      System Overview
                    </p>
                    <p className="text-sm text-gray-500">
                      {stats.totalUsers} total users, {stats.activeAttendances} currently active
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      Recent Alerts
                    </p>
                    <p className="text-sm text-gray-500">
                      {stats.recentAlerts} alerts in the system
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Guard Map */}
        <div className="bg-white shadow rounded-lg mt-6 overflow-x-auto">
          <div className="px-2 sm:px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Real-time Guard Locations
            </h3>
            {mapLoading ? (
              <div className="text-center text-gray-500">Loading map...</div>
            ) : (
              <div className="w-full" style={{ minWidth: '300px' }}>
                <MapContainer
                  center={[23.0225, 72.5714]}
                  zoom={11}
                  style={{ height: '400px', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <FitBounds locations={guardLocations} />
                  {guardLocations.map((loc, idx) => (
                    <Marker
                      key={loc.id || idx}
                      position={[
                        parseFloat(loc.latitude),
                        parseFloat(loc.longitude)
                      ]}
                      icon={guardIcon}
                    >
                      <Popup>
                        <div>
                          <div className="font-bold">{loc.guard?.name || 'Guard'}</div>
                          <div>Lat: {loc.latitude}, Lng: {loc.longitude}</div>
                          <div>Time: {new Date(loc.timestamp).toLocaleString()}</div>
                          {loc.accuracy && <div>Accuracy: {loc.accuracy}m</div>}
                          {loc.battery_level && <div>Battery: {loc.battery_level}%</div>}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            )}
            <div className="text-xs text-gray-400 mt-2">Auto-refreshes every 30 seconds</div>
          </div>
        </div>
      </div>
    );
  }

  // For non-admin users, show the existing dashboard
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, {user?.first_name || user?.username}!
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Quick Actions
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <a href="/attendance" className="focus:outline-none">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">Check Attendance</p>
                  <p className="text-sm text-gray-500">View your attendance records</p>
                </a>
              </div>
            </div>

            <div className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <a href="/alerts" className="focus:outline-none">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">View Alerts</p>
                  <p className="text-sm text-gray-500">Check system alerts</p>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

