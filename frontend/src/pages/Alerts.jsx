import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, Shield, Battery, MapPin, Plus } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Alerts = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [guards, setGuards] = useState([]);
  const [formData, setFormData] = useState({
    guard_id: '',
    alert_type: 'offline',
    severity: 'medium',
    message: ''
  });
  const [resolveLoading, setResolveLoading] = useState(null);

  useEffect(() => {
    fetchAlerts();
    if (user?.role !== 'guard') fetchGuards();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/reports/alerts/');
      setAlerts(response);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGuards = async () => {
    try {
      const response = await api.get('/auth/users/');
      // Filter only guard users
      const guardUsers = response.filter(user => user.role === 'guard');
      setGuards(guardUsers);
    } catch (error) {
      console.error('Error fetching guards:', error);
    }
  };

  const handleResolve = async (alertId) => {
    setResolveLoading(alertId);
    try {
      await api.post(`/reports/alerts/${alertId}/resolve/`);
      fetchAlerts();
    } catch (error) {
      console.error('Error resolving alert:', error);
    } finally {
      setResolveLoading(null);
    }
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reports/alerts/', formData);
      setShowCreateModal(false);
      setFormData({
        guard_id: '',
        alert_type: 'offline',
        severity: 'medium',
        message: ''
      });
      fetchAlerts();
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'offline':
        return Clock;
      case 'geofence':
        return MapPin;
      case 'battery_low':
        return Battery;
      case 'panic':
        return Shield;
      default:
        return AlertTriangle;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (user?.role === 'guard' && alert.guard?.username && user.username) {
      if (alert.guard.username !== user.username) return false;
    }
    if (filter === 'unresolved') return !alert.is_resolved;
    if (filter === 'resolved') return alert.is_resolved;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-2 sm:px-4 md:px-8 lg:px-16 xl:px-32">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alerts & Notifications</h1>
          <p className="mt-1 text-sm text-gray-500">
            {user?.role === 'guard' ? 'Your system alerts and notifications' : 'Monitor and manage system alerts and guard notifications'}
          </p>
        </div>
        {user?.role !== 'guard' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Alert
          </button>
        )}
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Alerts</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{alerts.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Unresolved</dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {alerts.filter(a => !a.is_resolved).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Resolved</dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {alerts.filter(a => a.is_resolved).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="block w-40 px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="all">All Alerts</option>
          <option value="unresolved">Unresolved</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Alerts List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            {user?.role === 'guard' ? 'Your Alerts' : 'Alerts List'}
          </h3>
          {filteredAlerts.length > 0 ? (
            <div className="space-y-4">
              {filteredAlerts.map((alert) => {
                const Icon = getAlertIcon(alert.alert_type);
                return (
                  <div key={alert.id} className={`flex items-center p-4 rounded-lg shadow-sm border ${alert.severity === 'critical' ? 'border-red-500' : 'border-gray-200'} bg-white`}>
                    <div className="mr-4">
                      <Icon className={`h-6 w-6 ${getSeverityColor(alert.severity)}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-900">{alert.alert_type.replace('_', ' ').toUpperCase()}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(alert.severity)}`}>{alert.severity.toUpperCase()}</span>
                        {!alert.is_resolved && <span className="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-600">Unresolved</span>}
                        {alert.is_resolved && <span className="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-600">Resolved</span>}
                      </div>
                      <div className="text-sm text-gray-700 mt-1">{alert.message}</div>
                      <div className="text-xs text-gray-500 mt-1">{new Date(alert.created_at).toLocaleString()}</div>
                    </div>
                    {!alert.is_resolved && user?.role === 'guard' && (
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="ml-4 px-3 py-1 rounded bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                        disabled={resolveLoading === alert.id}
                      >
                        {resolveLoading === alert.id ? 'Resolving...' : 'Acknowledge'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">No alerts found.</div>
          )}
        </div>
      </div>

      {/* Create Alert Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Alert</h3>
              <form onSubmit={handleCreateAlert} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Guard</label>
                  <select
                    value={formData.guard_id}
                    onChange={(e) => setFormData({ ...formData, guard_id: e.target.value })}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a guard</option>
                    {guards.map(guard => (
                      <option key={guard.id} value={guard.id}>{guard.first_name} {guard.last_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Alert Type</label>
                  <select
                    value={formData.alert_type}
                    onChange={(e) => setFormData({ ...formData, alert_type: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="offline">Offline</option>
                    <option value="geofence">Geofence Violation</option>
                    <option value="battery_low">Low Battery</option>
                    <option value="panic">Panic Button</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Severity</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Message</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe the alert..."
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData({
                        guard_id: '',
                        alert_type: 'offline',
                        severity: 'medium',
                        message: ''
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Create Alert
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alerts;

