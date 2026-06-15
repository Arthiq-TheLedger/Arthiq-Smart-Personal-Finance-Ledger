import { useState } from 'react';
import api from '../utils/api';
import { todayISO } from '../utils/format';

export default function EntryForm({ companyId, onAdded }) {
  const [form, setForm] = useState({
    entry_date: todayISO(),
    title: '',
    entry_type: 'debit',
    amount: '',
    show_balance: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post(`/ledger/${companyId}`, {
        ...form,
        amount: parseFloat(form.amount),
      });
      setForm({ entry_date: todayISO(), title: '', entry_type: 'debit', amount: '', show_balance: false });
      onAdded();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card mb-6">
        <h3 className="text-heading mb-4 font-semibold">New Ledger Entry</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <input
          type="date"
          value={form.entry_date}
          onChange={(e) => setForm({ ...form, entry_date: e.target.value })}
          className="input-field"
          required
        />
        <input
          placeholder="Particulars (where & what)"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="input-field sm:col-span-2"
          required
        />
        <select
          value={form.entry_type}
          onChange={(e) => setForm({ ...form, entry_type: e.target.value })}
          className="input-field"
        >
          <option value="credit">Credit (+)</option>
          <option value="debit">Debit (-)</option>
        </select>
        <input
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Amount"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          className="input-field"
          required
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <label className="text-body flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.show_balance}
            onChange={(e) => setForm({ ...form, show_balance: e.target.checked })}
            className="rounded border-slate-300"
          />
          Print balance permanently on this entry
        </label>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Adding...' : 'Add Entry'}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
    </form>
  );
}
