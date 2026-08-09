import React, { useEffect, useState } from 'react';
import { FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../../Services/api';
import { useAuth } from '../../Context/Authcontext';

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get('/users');
        setUsers(data.users);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, role) => {
    setUpdatingId(userId);
    try {
      const { data } = await api.put(`/users/${userId}/role`, { role });
      setUsers((prev) => prev.map((u) => (u._id === userId ? data.user : u)));
      toast.success(`Role updated to "${role}"`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update role');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container-custom px-4 lg:px-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">Admin Users</h1>
          <p className="mt-2 text-gray-600">View registered customers and admin accounts.</p>

          <div className="mt-10 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-3 font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-3 font-semibold text-gray-900">Role</th>
                  <th className="px-6 py-3 font-semibold text-gray-900">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                      Loading users...
                    </td>
                  </tr>
                ) : users.length ? (
users.map((user) => {
                    const isSelf = currentUser?._id === user._id;
                    return (
                      <tr key={user._id}>
                        <td className="px-6 py-4 text-gray-900">
                          {user.name}
                          {isSelf && <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">You</span>}
                        </td>
                        <td className="px-6 py-4 text-gray-600">{user.email}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <select
                              value={user.role}
                              disabled={updatingId === user._id}
                              onChange={(e) => handleRoleChange(user._id, e.target.value)}
                              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50"
                            >
                              <option value="customer">customer</option>
                              <option value="admin">admin</option>
                            </select>
                            {updatingId === user._id && <FaSpinner className="animate-spin text-pink-600" />}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{new Date(user.createdAt).toLocaleDateString()}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
