import { useState } from 'react';
import { Lock } from 'lucide-react';
import api, { setUnlockToken } from '../utils/api';

export default function UnlockModal({ companyId, companyName, onUnlocked, onCancel }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post(`/companies/${companyId}/unlock`, { password });
      setUnlockToken(companyId, res.data.unlockToken);
      onUnlocked();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to unlock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card mx-auto w-full max-w-md shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-full bg-teal-50 p-3 dark:bg-teal-900/30">
            <Lock className="text-teal-700 dark:text-teal-400" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Unlock {companyName}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Enter the company password to continue</p>
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
            <button type="button" onClick={onCancel} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Unlocking...' : 'Unlock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
