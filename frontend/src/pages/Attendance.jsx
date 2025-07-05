import { useState, useEffect } from 'react';
import { Clock, Download, Filter, CheckCircle, XCircle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Attendance = () => {
  const { user } = useAuth();
  const [attendances, setAttendances] = useState([]);
  const [activeAttendances, setActiveAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [checkinError, setCheckinError] = useState('');
  const [checkinSuccess, setCheckinSuccess] = useState('');

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const [attendanceRes, activeRes] = await Promise.all([
        api.get('/attendance/'),
        api.get('/attendance/active/')
      ]);
      setAttendances(attendanceRes);
      setActiveAttendances(activeRes);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async () => {
    setCheckinLoading(true);
    setCheckinError('');
    setCheckinSuccess('');
    // Get location from browser
    if (!navigator.geolocation) {
      setCheckinError('Geolocation is not supported by your browser.');
      setCheckinLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await api.post('/attendance/checkin/', {
            checkin_method: 'manual',
            notes: 'Manual check-in from dashboard',
            checkin_latitude: position.coords.latitude,
            checkin_longitude: position.coords.longitude,
          });
          setCheckinSuccess('Checked in successfully!');
          fetchAttendanceData();
        } catch (error) {
          setCheckinError('Check-in failed.');
        } finally {
          setCheckinLoading(false);
        }
      },
      (error) => {
        setCheckinError('Location permission denied or unavailable.');
        setCheckinLoading(false);
      }
    );
  };

  const handleCheckout = async (attendanceId) => {
    try {
      await api.post(`/attendance/checkout/${attendanceId}/`, {
        checkout_method: 'manual',
        notes: 'Manual checkout from dashboard'
      });
      fetchAttendanceData();
    } catch (error) {
      console.error('Error checking out:', error);
    }
  };

  const exportAttendance = async () => {
    try {
      const response = await fetch(`${api.baseURL}/attendance/export/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'attendance_export.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting attendance:', error);
    }
  };

  const formatDuration = (duration) => {
    if (!duration) return 'N/A';
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const filteredAttendances = attendances.filter(attendance => {
    if (user?.role === 'guard' && attendance.guard?.username && user.username) {
      if (attendance.guard.username !== user.username) return false;
    }
    if (filter === 'active') return !attendance.checkout_time;
    if (filter === 'completed') return attendance.checkout_time;
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="mt-1 text-sm text-gray-500">
            {user?.role === 'guard' ? 'Your check-ins, check-outs, and working hours' : 'Track guard check-ins, check-outs, and working hours'}
          </p>
        </div>
        <button
          onClick={exportAttendance}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 w-full sm:w-auto"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Guard Check-in Button */}
      {user?.role === 'guard' && activeAttendances.length === 0 && (
        <div className="bg-white shadow rounded-lg p-6 flex flex-col items-center">
          <div className="mb-4 text-lg font-semibold text-gray-700 text-center">You are currently <span className="text-red-600">checked out</span>.</div>
          <button
            onClick={handleCheckin}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-bold hover:bg-blue-700 disabled:opacity-50 w-full sm:w-auto"
            disabled={checkinLoading}
          >
            {checkinLoading ? 'Checking in...' : 'Check In Now'}
          </button>
          {checkinError && <div className="text-red-600 mt-2 text-center">{checkinError}</div>}
          {checkinSuccess && <div className="text-green-600 mt-2 text-center">{checkinSuccess}</div>}
        </div>
      )}

      {/* Active Attendances */}
      {activeAttendances.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-2 sm:px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Currently Active ({activeAttendances.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeAttendances.map((attendance) => (
                <div key={attendance.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {attendance.guard?.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        Started: {new Date(attendance.checkin_time).toLocaleString()}
                      </p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </span>
                    </div>
                    {user?.role === 'guard' && (
                      <button
                        onClick={() => handleCheckout(attendance.id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                      >
                        Check Out
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
        <Filter className="h-5 w-5 text-gray-400" />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="block w-full sm:w-40 px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="all">All Records</option>
          <option value="active">Active Only</option>
          <option value="completed">Completed Only</option>
        </select>
      </div>

      {/* Attendance Table */}
      <div className="bg-white shadow overflow-x-auto sm:rounded-md">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 sm:px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Guard</th>
              <th className="px-2 sm:px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Check-in</th>
              <th className="px-2 sm:px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Check-out</th>
              <th className="px-2 sm:px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Duration</th>
              <th className="px-2 sm:px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Check-in Method</th>
              <th className="px-2 sm:px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Check-out Method</th>
              <th className="px-2 sm:px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Notes</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAttendances.map((attendance) => (
              <tr key={attendance.id} className="hover:bg-gray-50">
                <td className="px-2 sm:px-4 py-2 whitespace-nowrap">{attendance.guard?.name}</td>
                <td className="px-2 sm:px-4 py-2 whitespace-nowrap">{attendance.checkin_time ? new Date(attendance.checkin_time).toLocaleString() : '-'}</td>
                <td className="px-2 sm:px-4 py-2 whitespace-nowrap">{attendance.checkout_time ? new Date(attendance.checkout_time).toLocaleString() : '-'}</td>
                <td className="px-2 sm:px-4 py-2 whitespace-nowrap">{formatDuration(attendance.duration)}</td>
                <td className="px-2 sm:px-4 py-2 whitespace-nowrap">{attendance.checkin_method}</td>
                <td className="px-2 sm:px-4 py-2 whitespace-nowrap">{attendance.checkout_method || '-'}</td>
                <td className="px-2 sm:px-4 py-2 whitespace-nowrap">{attendance.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Attendance;

