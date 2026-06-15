import { useState } from 'react';
import { Download } from 'lucide-react';
import { todayISO } from '../utils/format';
import { getUnlockToken } from '../utils/api';

export default function PdfExport({ companyId, companyName }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState(todayISO());
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!from || !to) return;
    setLoading(true);
    try {
      const token = getUnlockToken(companyId);
      const url = `/api/pdf/${companyId}?from=${from}&to=${to}`;
      const res = await fetch(url, {
        credentials: 'include',
        headers: token ? { 'x-company-unlock': token } : {},
      });
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${companyName}-ledger.pdf`;
      a.click();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
        <Download size={20} /> Export Ledger as PDF
      </h3>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        Generate a printable ledger book PDF for your chosen date range.
      </p>
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input-field" />
        </div>
        <button
          onClick={handleExport}
          disabled={!from || !to || loading}
          className="btn-primary flex items-center gap-2"
        >
          <Download size={16} />
          {loading ? 'Generating...' : 'Download PDF'}
        </button>
      </div>
    </div>
  );
}
