import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'manager',
    phone: ''
  });
  const [editMode, setEditMode] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/users/');
      setUsers(response);
    } catch (error) {
      setError('Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (editMode) {
        // Edit user
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password; // Don't send empty password
        await api.put(`/auth/users/${editUserId}/`, updateData);
        setSuccess('User updated successfully!');
      } else {
        // Create user
        await api.post('/auth/users/', formData);
        setSuccess('User created successfully!');
      }
      setShowModal(false);
      setFormData({ username: '', password: '', email: '', first_name: '', last_name: '', role: 'manager', phone: '' });
      setEditMode(false);
      setEditUserId(null);
      fetchUsers();
    } catch (error) {
      setError('Error creating/updating user');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEdit = (user) => {
    setEditMode(true);
    setEditUserId(user.id);
    setFormData({
      username: user.username,
      password: '', // Don't prefill password
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      phone: user.phone || ''
    });
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/auth/users/${userId}/`);
      setUsers(users.filter(u => u.id !== userId));
    } catch (error) {
      setError('Error deleting user');
    }
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage managers and guards for your organization
          </p>
        </div>
        <button
          onClick={() => { setShowModal(true); setEditMode(false); setFormData({ username: '', password: '', email: '', first_name: '', last_name: '', role: 'manager', phone: '' }); setError(''); setSuccess(''); }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
        >
          Add User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow overflow-x-auto sm:rounded-md">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 sm:px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Username</th>
              <th className="px-2 sm:px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Name</th>
              <th className="px-2 sm:px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Email</th>
              <th className="px-2 sm:px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Role</th>
              <th className="px-2 sm:px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Phone</th>
              <th className="px-2 sm:px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
              <th className="px-2 sm:px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-2 sm:px-4 py-2 whitespace-nowrap">{user.username}</td>
                <td className="px-2 sm:px-4 py-2 whitespace-nowrap">{user.first_name} {user.last_name}</td>
                <td className="px-2 sm:px-4 py-2 whitespace-nowrap">{user.email}</td>
                <td className="px-2 sm:px-4 py-2 whitespace-nowrap capitalize">{user.role}</td>
                <td className="px-2 sm:px-4 py-2 whitespace-nowrap">{user.phone}</td>
                <td className="px-2 sm:px-4 py-2 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </td>
                <td className="px-2 sm:px-4 py-2 whitespace-nowrap space-x-2">
                  <button
                    className="text-blue-600 hover:underline text-sm"
                    onClick={() => handleEdit(user)}
                  >
                    Edit
                  </button>
                  {user.id !== currentUser?.id && (
                    <button
                      className="text-red-600 hover:underline text-sm"
                      onClick={() => handleDelete(user.id)}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center px-2">
          <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{editMode ? 'Edit User' : 'Add New User'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <input type="text" name="username" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" value={formData.username} onChange={handleChange} disabled={editMode} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password {editMode && <span className="text-xs text-gray-400">(Leave blank to keep unchanged)</span>}</label>
                  <input type="password" name="password" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" value={formData.password} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input type="email" name="email" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" value={formData.email} onChange={handleChange} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <input type="text" name="first_name" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" value={formData.first_name} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input type="text" name="last_name" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" value={formData.last_name} onChange={handleChange} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select name="role" className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" value={formData.role} onChange={handleChange}>
                    <option value="manager">Manager</option>
                    <option value="guard">Guard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input type="text" name="phone" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" value={formData.phone} onChange={handleChange} />
                </div>
                {error && <div className="text-red-600 text-sm">{error}</div>}
                {success && <div className="text-green-600 text-sm">{success}</div>}
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                  <button type="button" onClick={() => { setShowModal(false); setEditMode(false); setEditUserId(null); }} className="px-4 py-2 bg-gray-200 rounded-md w-full sm:w-auto">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md w-full sm:w-auto">{editMode ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement; 