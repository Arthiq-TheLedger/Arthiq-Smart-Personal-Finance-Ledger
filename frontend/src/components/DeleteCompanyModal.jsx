import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import api, { clearUnlockToken } from '../utils/api';

export default function DeleteCompanyModal({ company, onDeleted, onCancel }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.delete(`/companies/${company.id}`, { data: { password } });
      clearUnlockToken(company.id);
      onDeleted();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="card mx-auto w-full max-w-md shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-full bg-rose-50 p-3 dark:bg-rose-900/30">
            <Trash2 className="text-rose-600 dark:text-rose-400" size={24} />
          </div>
          <div>
            <h2 className="text-heading text-lg font-semibold">Delete {company.name}?</h2>
            <p className="text-body text-sm">Enter the company password to confirm permanent deletion.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Company password"
            className="input-field"
            autoFocus
            required
          />
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={onCancel} className="btn-secondary flex-1" disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-rose-600 px-4 py-2.5 font-medium text-white transition hover:bg-rose-700 hover:shadow-md disabled:opacity-60"
            >
              {loading ? 'Deleting...' : 'Delete Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
