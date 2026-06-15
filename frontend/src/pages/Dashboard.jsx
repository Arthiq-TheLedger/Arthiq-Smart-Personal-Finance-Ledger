import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Building2, Users, Trash2 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import DeleteCompanyModal from '../components/DeleteCompanyModal';
import api, { clearAllUnlockTokens } from '../utils/api';

export default function Dashboard() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: '', password: '', description: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    clearAllUnlockTokens();
    api.get('/companies').then((res) => setCompanies(res.data)).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/companies', form);
      setCompanies((prev) => [res.data, ...prev]);
      setShowCreate(false);
      setForm({ name: '', password: '', description: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create company');
    }
  };

  const handleDeleted = () => {
    setCompanies((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-heading text-2xl font-bold">Your Companies</h1>
            <p className="text-muted">Manage ledgers for home, business, or any purpose</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> New Company
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
          </div>
        ) : companies.length === 0 ? (
          <div className="card text-center py-16">
            <Building2 className="mx-auto mb-4 text-slate-400 dark:text-slate-500" size={48} />
            <h2 className="text-heading mb-2 text-lg font-semibold">No companies yet</h2>
            <p className="text-muted mb-4">Create your first ledger to start tracking expenses</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary">Create Company</button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {companies.map((c) => (
              <div key={c.id} className="card group relative transition hover:border-teal-600/40 hover:shadow-md">
                <Link to={`/company/${c.id}`} className="block">
                  <div className="flex items-start justify-between gap-8">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-heading text-lg font-semibold transition group-hover:text-teal-700 dark:group-hover:text-teal-400">
                        {c.name}
                      </h3>
                      {c.description && (
                        <p className="text-muted mt-1 text-sm">{c.description}</p>
                      )}
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      c.is_owner
                        ? 'bg-teal-50 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                    }`}>
                      {c.is_owner ? 'Owner' : c.role}
                    </span>
                  </div>
                  <div className="text-muted mt-4 flex items-center gap-2 text-xs">
                    <Users size={14} />
                    {c.is_owner ? 'You own this ledger' : 'Shared with you'}
                  </div>
                </Link>
                {c.is_owner && (
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(c)}
                    className="absolute bottom-4 right-4 rounded-lg bg-rose-50 p-2 text-rose-600 transition hover:bg-rose-100 hover:shadow-sm dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50 sm:opacity-0 sm:group-hover:opacity-100"
                    title="Delete company"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card mx-auto w-full max-w-md">
            <h2 className="text-heading mb-4 text-lg font-semibold">Create New Company</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <input
                placeholder="Company name (e.g., Home Expenses)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field"
                required
              />
              <input
                type="password"
                placeholder="Password to protect this ledger"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-field"
                required
                minLength={4}
              />
              <textarea
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input-field"
                rows={2}
              />
              {error && <p className="text-sm text-rose-600">{error}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <DeleteCompanyModal
          company={deleteTarget}
          onDeleted={handleDeleted}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
