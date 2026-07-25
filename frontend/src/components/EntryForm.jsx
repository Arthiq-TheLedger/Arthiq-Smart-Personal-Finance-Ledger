import { useCallback, useEffect, useRef, useState } from 'react';
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
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const wrapRef = useRef(null);

  const fetchSuggestions = useCallback(
    async (text) => {
      const q = text.trim();
      if (q.length < 1) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await api.get(`/ledger/${companyId}/titles`, { params: { q } });
        setSuggestions(res.data);
        setShowSuggestions(res.data.length > 0);
      } catch {
        setSuggestions([]);
      }
    },
    [companyId]
  );

  useEffect(() => {
    const timer = setTimeout(() => fetchSuggestions(form.title), 200);
    return () => clearTimeout(timer);
  }, [form.title, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pickSuggestion = (value) => {
    setForm((prev) => ({ ...prev, title: value }));
    setShowSuggestions(false);
    setActiveSuggestion(-1);
  };

  const handleTitleKeyDown = (e) => {
    if (!showSuggestions || !suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && activeSuggestion >= 0) {
      e.preventDefault();
      pickSuggestion(suggestions[activeSuggestion]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

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
      setSuggestions([]);
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
        <div className="relative sm:col-span-2" ref={wrapRef}>
          <input
            placeholder="Particulars (where & what)"
            value={form.title}
            onChange={(e) => {
              setForm({ ...form, title: e.target.value });
              setActiveSuggestion(-1);
            }}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onKeyDown={handleTitleKeyDown}
            className="input-field w-full"
            autoComplete="off"
            required
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800">
              {suggestions.map((s, i) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => pickSuggestion(s)}
                    className={`block w-full px-3 py-2 text-left text-sm hover:bg-teal-50 dark:hover:bg-teal-900/30 ${
                      i === activeSuggestion ? 'bg-teal-50 dark:bg-teal-900/40' : ''
                    }`}
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
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
