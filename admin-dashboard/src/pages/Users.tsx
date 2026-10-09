import { useEffect, useState } from 'react';
import client from '../api/client';
import Loader from '../components/Loader';
import ConfirmDialog from '../components/ConfirmDialog';
import '../styles/table.css';

interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  country: string | null;
  region: string | null;
  city: string | null;
  createdAt: string;
  _count: { quizSessions: number; feedbacks: number; lotteryWins: number };
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    client
      .get('/admin/users', { params: search ? { search } : {} })
      .then((res) => setUsers(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = () => fetchUsers();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await client.delete(`/admin/users/${deleteTarget.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Users</h1>
      <p className="page-subtitle">Manage registered users on the platform</p>

      <div className="table-toolbar">
        <div className="table-search">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button className="btn btn-ghost btn-sm" onClick={handleSearch}>
          Search
        </button>
        <span className="table-count">{users.length} users</span>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Quizzes</th>
                <th>Wins</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      {user.name}
                    </td>
                    <td>{user.email}</td>
                    <td>{user.phoneNumber}</td>
                    <td>
                      <span className={`badge ${user.role === 'ADMIN' ? 'badge-violet' : 'badge-blue'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>{user._count.quizSessions}</td>
                    <td>{user._count.lotteryWins}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="table-actions">
                        {user.role !== 'ADMIN' && (
                          <button
                            className="btn-icon danger"
                            title="Delete user"
                            onClick={() => setDeleteTarget(user)}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will also remove all their quiz sessions, feedback, and lottery wins.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleting}
      />
    </div>
  );
}
