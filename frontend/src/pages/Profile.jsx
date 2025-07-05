import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import api from '../services/api';

const Profile = () => {
  const { user } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Profile editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });
  const [editLoading, setEditLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/change-password/', {
        current_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setSuccess('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await api.put('/auth/profile/', editForm);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      // Update the user context if needed
      window.location.reload(); // Simple refresh to update user data
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setEditLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoleDisplayName = (role) => {
    const roleMap = {
      'admin': 'Administrator',
      'manager': 'Manager',
      'guard': 'Guard'
    };
    return roleMap[role] || role;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-2 sm:px-4 md:px-8 lg:px-16 xl:px-32">
      <div className="max-w-4xl mx-auto bg-white p-4 sm:p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">My Profile</h2>
        <div className="mb-6 space-y-2">
          <div><span className="font-semibold">Name:</span> {user?.first_name} {user?.last_name}</div>
          <div><span className="font-semibold">Username:</span> {user?.username}</div>
          <div><span className="font-semibold">Phone:</span> {user?.phone || 'N/A'}</div>
          <div><span className="font-semibold">Organization:</span> {user?.organization?.name}</div>
          <div><span className="font-semibold">Role:</span> {user?.role}</div>
        </div>
        <hr className="my-4" />
        <h3 className="text-lg font-semibold mb-2">Change Password</h3>
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Old Password</label>
            <input type="password" className="mt-1 block w-full border rounded px-3 py-2" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium">New Password</label>
            <input type="password" className="mt-1 block w-full border rounded px-3 py-2" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium">Confirm New Password</label>
            <input type="password" className="mt-1 block w-full border rounded px-3 py-2" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">{success}</div>}
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full sm:w-auto" disabled={loading}>{loading ? 'Changing...' : 'Change Password'}</button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
