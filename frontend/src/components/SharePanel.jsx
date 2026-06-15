import { useEffect, useState } from 'react';
import { UserPlus, Trash2 } from 'lucide-react';
import api from '../utils/api';

export default function SharePanel({ companyId, isOwner }) {
  const [members, setMembers] = useState({ owner: null, members: [] });
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('read');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = () => {
    api.get(`/companies/${companyId}/members`).then((res) => setMembers(res.data));
  };

  useEffect(() => { load(); }, [companyId]);

  const handleShare = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post(`/companies/${companyId}/share`, { email, role });
      setMessage('Access granted successfully');
      setEmail('');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to share');
    }
  };

  const handleRemove = async (userId) => {
    await api.delete(`/companies/${companyId}/members/${userId}`);
    load();
  };

  return (
    <div className="space-y-6">
      {isOwner && (
        <form onSubmit={handleShare} className="card">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <UserPlus size={20} /> Share Company
          </h3>
          <p className="mb-4 text-sm text-gray-500">
            Share with registered users by their email. They must have signed in at least once.
          </p>
          <div className="flex flex-wrap gap-3">
            <input
              type="email"
              placeholder="user@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field min-w-[200px] flex-1"
              required
            />
            <select value={role} onChange={(e) => setRole(e.target.value)} className="input-field w-auto min-w-[140px]">
              <option value="read">Read Only</option>
              <option value="write">Write Only</option>
              <option value="both">Read & Write</option>
            </select>
            <button type="submit" className="btn-primary">Share</button>
          </div>
          {message && <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">{message}</p>}
          {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
        </form>
      )}

      <div className="card">
        <h3 className="mb-4 font-semibold">Members</h3>
        <div className="space-y-3">
          {members.owner && (
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50">
              <div className="flex items-center gap-3">
                {members.owner.avatar_url && (
                  <img src={members.owner.avatar_url} alt="" className="h-8 w-8 rounded-full" />
                )}
                <div>
                  <p className="font-medium">{members.owner.name}</p>
                  <p className="text-xs text-gray-500">{members.owner.email}</p>
                </div>
              </div>
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800 dark:bg-teal-900/40 dark:text-teal-200">
                Owner
              </span>
            </div>
          )}
          {members.members.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50">
              <div className="flex items-center gap-3">
                {m.avatar_url && <img src={m.avatar_url} alt="" className="h-8 w-8 rounded-full" />}
                <div>
                  <p className="font-medium">{m.name}</p>
                  <p className="text-xs text-gray-500">{m.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-600 dark:text-slate-200">
                  {m.role === 'both' ? 'Read & Write' : m.role === 'read' ? 'Read Only' : 'Write Only'}
                </span>
                {isOwner && (
                  <button onClick={() => handleRemove(m.id)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
