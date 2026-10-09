import { useEffect, useState, FormEvent, useRef } from 'react';
import client from '../api/client';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import '../styles/table.css';

interface Question {
  id: number;
  questionText: string;
  options: string[];
  correctAnswer: string;
  isActive: boolean;
}

const emptyForm = { questionText: '', options: ['', '', '', ''], correctAnswer: '', isActive: true };

export default function Questions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setLoading(true);
        const res = await client.post('/admin/questions/bulk', json);
        alert(res.data.message);
        fetchQuestions();
      } catch (err: any) {
        console.error(err);
        alert(err.response?.data?.error || 'Invalid JSON format or failed to upload');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const fetchQuestions = () => {
    setLoading(true);
    client
      .get('/admin/questions')
      .then((res) => setQuestions(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchQuestions(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (q: Question) => {
    setEditing(q);
    setForm({
      questionText: q.questionText,
      options: [...q.options],
      correctAnswer: q.correctAnswer,
      isActive: q.isActive,
    });
    setModalOpen(true);
  };

  const handleOptionChange = (idx: number, value: string) => {
    const opts = [...form.options];
    opts[idx] = value;
    setForm({ ...form, options: opts });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const res = await client.put(`/admin/questions/${editing.id}`, form);
        setQuestions((prev) =>
          prev.map((q) => (q.id === editing.id ? res.data : q))
        );
      } else {
        const res = await client.post('/admin/questions', form);
        setQuestions((prev) => [...prev, res.data]);
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
      await client.delete(`/admin/questions/${deleteTarget.id}`);
      setQuestions((prev) => prev.filter((q) => q.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Questions</h1>
      <p className="page-subtitle">Manage quiz questions for the platform</p>

      <div className="table-toolbar">
        <span className="table-count">{questions.length} questions</span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleBulkUpload}
            style={{ display: 'none' }}
          />
          <button className="btn btn-ghost" onClick={() => fileInputRef.current?.click()}>
            Upload JSON
          </button>
          <button className="btn btn-primary" onClick={openCreate}>
            + Add Question
          </button>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Question</th>
                <th>Correct Answer</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
                    No questions yet
                  </td>
                </tr>
              ) : (
                questions.map((q) => (
                  <tr key={q.id}>
                    <td>{q.id}</td>
                    <td style={{ color: 'var(--text-primary)', maxWidth: '400px' }}>
                      {q.questionText}
                    </td>
                    <td>
                      <span className="badge badge-emerald">{q.correctAnswer}</span>
                    </td>
                    <td>
                      <span className={`badge ${q.isActive ? 'badge-emerald' : 'badge-rose'}`}>
                        {q.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-icon" title="Edit" onClick={() => openEdit(q)}>
                          ✏️
                        </button>
                        <button
                          className="btn-icon danger"
                          title="Delete"
                          onClick={() => setDeleteTarget(q)}
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Question' : 'New Question'}
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
            <label className="form-label">Question Text</label>
            <textarea
              className="form-textarea"
              value={form.questionText}
              onChange={(e) => setForm({ ...form, questionText: e.target.value })}
              placeholder="Enter the question..."
              required
            />
          </div>

          {form.options.map((opt, idx) => (
            <div className="form-group" key={idx}>
              <label className="form-label">Option {idx + 1}</label>
              <input
                className="form-input"
                value={opt}
                onChange={(e) => handleOptionChange(idx, e.target.value)}
                placeholder={`Option ${idx + 1}`}
                required
              />
            </div>
          ))}

          <div className="form-group">
            <label className="form-label">Correct Answer</label>
            <select
              className="form-select"
              value={form.correctAnswer}
              onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
              required
            >
              <option value="">Select correct answer</option>
              {form.options
                .filter((o) => o.trim())
                .map((opt, idx) => (
                  <option key={idx} value={opt}>
                    {opt}
                  </option>
                ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              Active
            </label>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Question"
        message={`Are you sure you want to delete this question? Related answers will also be removed.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleting}
      />
    </div>
  );
}
