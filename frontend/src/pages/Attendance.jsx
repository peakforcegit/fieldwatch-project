import { useState, useEffect } from 'react';
import { Clock, Download, Filter, CheckCircle, XCircle, Calendar, CalendarDays } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns';
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
  const [selectedGuard, setSelectedGuard] = useState(null);
  const [guards, setGuards] = useState([]);
  const [viewMode, setViewMode] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchAttendanceData();
    if (user?.role !== 'guard') {
      api.get('/guards/').then(data => {
        setGuards(data);
        if (data.length > 0) {
          setSelectedGuard(String(data[0].id));
        } else {
          setSelectedGuard('');
        }
      });
    } else {
      setSelectedGuard(String(user.id));
    }
  }, []);

  useEffect(() => {
    console.log('attendances:', attendances);
    console.log('activeAttendances:', activeAttendances);
    console.log('user:', user);
    console.log('selectedGuard:', selectedGuard);
  }, [attendances, activeAttendances, user, selectedGuard]);

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
    console.log('Starting check-in process...');
    // Get location from browser
    if (!navigator.geolocation) {
      setCheckinError('Geolocation is not supported by your browser.');
      setCheckinLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          console.log('Location obtained, sending check-in request...');
          const result = await api.post('/attendance/checkin/', {
            checkin_method: 'manual',
            notes: 'Manual check-in from dashboard',
            checkin_latitude: position.coords.latitude,
            checkin_longitude: position.coords.longitude,
          });
          console.log('Check-in successful:', result);
          setCheckinSuccess('Checked in successfully!');
          fetchAttendanceData();
        } catch (error) {
          console.error('Check-in failed:', error);
          setCheckinError('Check-in failed.');
        } finally {
          setCheckinLoading(false);
        }
      },
      (error) => {
        console.error('Location error:', error);
        setCheckinError('Location permission denied or unavailable.');
        setCheckinLoading(false);
      }
    );
  };

  const handleCheckout = async (attendanceId) => {
    console.log('Starting check-out process for attendance ID:', attendanceId);
    try {
      const result = await api.post(`/attendance/checkout/${attendanceId}/`, {
        checkout_method: 'manual',
        notes: 'Manual checkout from dashboard'
      });
      console.log('Check-out successful:', result);
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

  // Filter attendances and activeAttendances based on selectedGuard for admin/manager
  const filteredAttendances = user?.role === 'guard'
    ? attendances.filter(attendance => attendance.guard?.username === user.username)
    : attendances.filter(attendance => String(attendance.guard?.id) === selectedGuard);

  const filteredActiveAttendances = user?.role === 'guard'
    ? activeAttendances.filter(attendance => attendance.guard?.username === user.username)
    : activeAttendances.filter(attendance => String(attendance.guard?.id) === selectedGuard);

  // Debug useEffect for filtered data
  useEffect(() => {
    console.log('filteredActiveAttendances:', filteredActiveAttendances);
  }, [filteredActiveAttendances]);

  // Attendance status logic
  const getAttendanceForDate = (date) => {
    return filteredAttendances.filter(attendance => isSameDay(new Date(attendance.checkin_time), date));
  };
  const getAttendanceStatus = (date) => {
    const dayAttendances = getAttendanceForDate(date);
    if (dayAttendances.length === 0) return 'absent';
    if (dayAttendances.some(att => !att.checkout_time)) return 'active';
    return 'present';
  };

  // Monthly summary
  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const monthlyStats = monthDays.reduce((stats, day) => {
    const status = getAttendanceStatus(day);
    stats[status]++;
    return stats;
  }, { present: 0, active: 0, absent: 0 });

  const selectedDateAttendances = getAttendanceForDate(selectedDate);
  const selectedDateStatus = getAttendanceStatus(selectedDate);

  // Place these after all useState/useEffect hooks, but before any return or render logic:
  const calendarModifiers = {
    present: (date) => getAttendanceStatus(date) === 'present',
    active: (date) => getAttendanceStatus(date) === 'active',
    absent: (date) => getAttendanceStatus(date) === 'absent',
    today: (date) => isToday(date),
    selected: (date) => isSameDay(date, selectedDate),
  };
  const calendarModifiersStyles = {
    present: { backgroundColor: '#10B981', color: 'white' },
    active: { backgroundColor: '#3B82F6', color: 'white' },
    absent: { backgroundColor: '#EF4444', color: 'white' },
    today: { border: '2px solid #3B82F6' },
    selected: { backgroundColor: '#8B5CF6', color: 'white' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-2 sm:px-4 md:px-8 lg:px-16 xl:px-32">
      {/* Show new calendar for guards */}
      {/* Guard selection for admin/manager */}
      {user?.role !== 'guard' && (
        <div className="mb-4 flex items-center gap-2">
          <label className="font-medium">Select Guard:</label>
          <select
            className="border rounded px-2 py-1"
            value={selectedGuard}
            onChange={e => setSelectedGuard(e.target.value)}
            disabled={guards.length === 0}
          >
            {guards.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      )}
      {/* Only show the single calendar above if summary/details block is NOT being shown */}
      {user?.role !== 'guard' && guards.length > 0 && selectedGuard && viewMode === 'calendar' && !(((user?.role === 'guard') || (user?.role !== 'guard' && selectedGuard)) && viewMode === 'calendar') && (
        <div className="mb-8 flex justify-center w-full">
          <div className="w-full max-w-xl">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={calendarModifiers}
              modifiersStyles={calendarModifiersStyles}
              className="w-full"
            />
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="mt-1 text-sm text-gray-500">
            {user?.role === 'guard' ? 'Your check-ins, check-outs, and working hours' : 'Track guard check-ins, check-outs, and working hours'}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-2 text-sm font-medium ${viewMode === 'calendar'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
                } rounded-l-md`}
            >
              <Calendar className="h-4 w-4 inline mr-1" />
              Calendar
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm font-medium ${viewMode === 'table'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
                } rounded-r-md`}
            >
              <Clock className="h-4 w-4 inline mr-1" />
              Table
            </button>
          </div>
          <button
            onClick={exportAttendance}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Debug Information for Guards */}
      {user?.role === 'guard' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">Debug Info:</h4>
          <div className="text-xs text-yellow-700 space-y-1">
            <div>User Role: {user?.role}</div>
            <div>Username: {user?.username}</div>
            <div>Active Attendances Count: {activeAttendances.length}</div>
            <div>Filtered Active Attendances Count: {filteredActiveAttendances.length}</div>
            <div>Show Check-in Button: {user?.role === 'guard' && filteredActiveAttendances.length === 0 ? 'Yes' : 'No'}</div>
            <div>Show Check-out Button: {user?.role === 'guard' && filteredActiveAttendances.length > 0 ? 'Yes' : 'No'}</div>
          </div>
        </div>
      )}

      {/* Guard Check-in Button */}
      {user?.role === 'guard' && filteredActiveAttendances.length === 0 && (
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
      {filteredActiveAttendances.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-2 sm:px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Currently Active ({filteredActiveAttendances.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredActiveAttendances.map((attendance) => (
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

      {((user?.role === 'guard') || (user?.role !== 'guard' && selectedGuard)) && viewMode === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Summary Cards */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Summary</h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{monthlyStats.present}</div>
                  <div className="text-sm text-green-700">Present Days</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{monthlyStats.active}</div>
                  <div className="text-sm text-blue-700">Active Days</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{monthlyStats.absent}</div>
                  <div className="text-sm text-red-700">Absent Days</div>
                </div>
              </div>
              {/* Calendar Legend */}
              <div className="flex flex-wrap gap-4 mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span>Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span>Absent</span>
                </div>
              </div>
              {/* Calendar */}
              <div>
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="w-full"
                  modifiers={calendarModifiers}
                  modifiersStyles={calendarModifiersStyles}
                />
                {/* Selected Date Details */}
                <div className="bg-white shadow rounded-lg p-6 mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </h3>
                  {/* Status Badge */}
                  <div className="mb-4">
                    {selectedDateStatus === 'present' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Present
                      </span>
                    )}
                    {selectedDateStatus === 'active' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        <Clock className="h-4 w-4 mr-1" />
                        Active
                      </span>
                    )}
                    {selectedDateStatus === 'absent' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        <XCircle className="h-4 w-4 mr-1" />
                        Absent
                      </span>
                    )}
                  </div>
                  {/* Attendance Details */}
                  {selectedDateAttendances.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Attendance Records:</h4>
                      {selectedDateAttendances.map((attendance, index) => (
                        <div key={attendance.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              Session {index + 1}
                            </div>
                            <div className="text-gray-600 mt-1">
                              <div>Check-in: {new Date(attendance.checkin_time).toLocaleTimeString()}</div>
                              {attendance.checkout_time && (
                                <div>Check-out: {new Date(attendance.checkout_time).toLocaleTimeString()}</div>
                              )}
                              <div>Method: {attendance.checkin_method}</div>
                              {attendance.notes && (
                                <div className="mt-1 text-xs text-gray-500">
                                  Notes: {attendance.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-4">
                      No attendance records for this date
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;

