import { useEffect, useState, FormEvent } from 'react';
import client from '../api/client';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import '../styles/table.css';

interface Reward {
  id: number;
  name: string;
  imageUrl: string;
  type: string;
}

const emptyForm = { name: '', imageUrl: '', type: 'MINI' as 'MINI' | 'GRAND' };

export default function Rewards() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Reward | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Reward | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRewards = () => {
    setLoading(true);
    client
      .get('/admin/rewards')
      .then((res) => setRewards(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRewards(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (r: Reward) => {
    setEditing(r);
    setForm({ name: r.name, imageUrl: r.imageUrl, type: r.type as 'MINI' | 'GRAND' });
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const res = await client.put(`/admin/rewards/${editing.id}`, form);
        setRewards((prev) => prev.map((r) => (r.id === editing.id ? res.data : r)));
      } else {
        const res = await client.post('/admin/rewards', form);
        setRewards((prev) => [...prev, res.data]);
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await client.delete(`/admin/rewards/${deleteTarget.id}`);
      setRewards((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Rewards</h1>
      <p className="page-subtitle">Manage lottery prizes and rewards</p>

      <div className="table-toolbar">
        <span className="table-count">{rewards.length} rewards</span>
        <button className="btn btn-primary" onClick={openCreate}>
          + Add Reward
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Image</th>
                <th>Name</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rewards.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
                    No rewards yet
                  </td>
                </tr>
              ) : (
                rewards.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>
                      <img
                        src={r.imageUrl}
                        alt={r.name}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 'var(--radius-sm)',
                          objectFit: 'cover',
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect fill="%231e293b" width="40" height="40" rx="6"/><text x="50%" y="55%" text-anchor="middle" fill="%2364748b" font-size="16">🎁</text></svg>';
                        }}
                      />
                    </td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{r.name}</td>
                    <td>
                      <span className={`badge ${r.type === 'GRAND' ? 'badge-amber' : 'badge-blue'}`}>
                        {r.type}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-icon" title="Edit" onClick={() => openEdit(r)}>
                          ✏️
                        </button>
                        <button
                          className="btn-icon danger"
                          title="Delete"
                          onClick={() => setDeleteTarget(r)}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Reward' : 'New Reward'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Reward Name</label>
            <input
              className="form-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Wireless Headphones"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Image URL</label>
            <input
              className="form-input"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://..."
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select
              className="form-select"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as 'MINI' | 'GRAND' })}
            >
              <option value="MINI">MINI</option>
              <option value="GRAND">GRAND</option>
            </select>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Reward"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleting}
      />
    </div>
  );
}
