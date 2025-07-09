import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FileText, Download, Calendar, TrendingUp, Users, Clock, MapPin } from 'lucide-react';
import api from '../services/api';

const Reports = () => {
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMonthlyReport();
  }, []);

  const fetchMonthlyReport = async () => {
    try {
      const response = await api.get('/reports/monthly/');
      setMonthlyReport(response);
    } catch (error) {
      console.error('Error fetching monthly report:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-2xl font-semibold text-gray-900">{value}</dd>
              {subtitle && (
                <dd className="text-sm text-gray-500">{subtitle}</dd>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monthly performance insights and detailed analytics
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Calendar className="h-4 w-4 mr-2" />
            Select Period
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Period Info */}
      {monthlyReport && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-900">
              Report Period: {monthlyReport.period}
            </span>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {monthlyReport && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Attendance Days"
            value={monthlyReport.total_attendance_days}
            icon={Clock}
            color="text-blue-600"
          />
          <StatCard
            title="Average Daily Attendance"
            value={monthlyReport.average_daily_attendance.toFixed(1)}
            icon={TrendingUp}
            color="text-green-600"
          />
          <StatCard
            title="Total Alerts"
            value={monthlyReport.alert_summary?.total_alerts || 0}
            icon={FileText}
            color="text-yellow-600"
          />
          <StatCard
            title="Resolved Alerts"
            value={monthlyReport.alert_summary?.resolved_alerts || 0}
            icon={Users}
            color="text-purple-600"
          />
          <StatCard
            title="Manual Check-outs"
            value={monthlyReport.checkout_method_counts?.manual || 0}
            icon={Clock}
            color="text-gray-600"
          />
          <StatCard
            title="Auto Check-outs"
            value={monthlyReport.checkout_method_counts?.auto || 0}
            icon={Clock}
            color="text-yellow-600"
          />
          <StatCard
            title="Geo Check-outs"
            value={monthlyReport.checkout_method_counts?.geo || 0}
            icon={MapPin}
            color="text-red-600"
          />
        </div>
      )}

      {/* Guard Performance Chart */}
      {monthlyReport?.guard_performance && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Guard Performance</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={monthlyReport.guard_performance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="guard_name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total_hours" fill="#3B82F6" name="Total Hours" />
              <Bar dataKey="attendance_days" fill="#10B981" name="Attendance Days" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Guard Performance Table */}
      {monthlyReport?.guard_performance && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Detailed Guard Performance
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Guard Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance Days
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Hours/Day
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {monthlyReport.guard_performance.map((guard, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {guard.guard_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {guard.attendance_days}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {guard.total_hours}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {guard.avg_hours_per_day}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${guard.avg_hours_per_day >= 8
                            ? 'bg-green-100 text-green-800'
                            : guard.avg_hours_per_day >= 6
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                          {guard.avg_hours_per_day >= 8 ? 'Excellent' :
                            guard.avg_hours_per_day >= 6 ? 'Good' : 'Needs Improvement'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Geo Check-out Events Table */}
      {monthlyReport?.geo_checkout_events && monthlyReport.geo_checkout_events.length > 0 && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md mt-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Geofence (Geo) Check-out Events
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guard</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {monthlyReport.geo_checkout_events.map((event, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 whitespace-nowrap">{event.guard}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{event.shift}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{new Date(event.checkin_time).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{new Date(event.checkout_time).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{event.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Alert Summary */}
      {monthlyReport?.alert_summary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Alerts by Type</h3>
            {monthlyReport.alert_summary.by_type.length > 0 ? (
              <div className="space-y-3">
                {monthlyReport.alert_summary.by_type.map((alert, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {alert.alert_type}
                    </span>
                    <span className="text-sm text-gray-500">{alert.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No alerts this period</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Alerts by Severity</h3>
            {monthlyReport.alert_summary.by_severity.length > 0 ? (
              <div className="space-y-3">
                {monthlyReport.alert_summary.by_severity.map((alert, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className={`text-sm font-medium capitalize ${alert.severity === 'critical' ? 'text-red-600' :
                        alert.severity === 'high' ? 'text-orange-600' :
                          alert.severity === 'medium' ? 'text-yellow-600' :
                            'text-green-600'
                      }`}>
                      {alert.severity}
                    </span>
                    <span className="text-sm text-gray-500">{alert.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No alerts this period</p>
            )}
          </div>
        </div>
      )}

      {/* No Data State */}
      {!monthlyReport && !loading && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No report data available</h3>
          <p className="mt-1 text-sm text-gray-500">
            Reports will be generated once you have attendance and activity data.
          </p>
        </div>
      )}
    </div>
  );
};

export default Reports;

