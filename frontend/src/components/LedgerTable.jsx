import { useState } from 'react';
import { Check, X, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/format';
import api from '../utils/api';
import ConfirmModal from './ConfirmModal';

export default function LedgerTable({ entries, companyId, canWrite, onUpdate }) {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const toggleBalance = async (entry) => {
    try {
      await api.patch(`/ledger/${companyId}/${entry.id}/balance`, {
        show_balance: !entry.show_balance,
      });
      onUpdate();
    } catch {
      /* ignore */
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/ledger/${companyId}/${deleteTarget.id}`);
      setDeleteTarget(null);
      onUpdate();
    } catch {
      /* ignore */
    } finally {
      setDeleting(false);
    }
  };

  if (!entries.length) {
    return (
      <div className="card py-12 text-center text-slate-500">
        No entries yet. Add your first ledger entry above.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-ledger-line">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Particulars</th>
              <th className="text-center">+/-</th>
              <th className="text-right">Amount (₹)</th>
              <th className="text-right">Balance (₹)</th>
              <th>Recorded By</th>
              {canWrite && <th className="text-center">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td className="whitespace-nowrap text-sm">{formatDate(entry.entry_date)}</td>
                <td>{entry.title}</td>
                <td className="text-center font-bold">
                  <span className={entry.entry_type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}>
                    {entry.entry_type === 'credit' ? '+' : '-'}
                  </span>
                </td>
                <td className="text-right font-mono">{formatCurrency(entry.amount)}</td>
                <td className="text-right font-mono">
                  {entry.show_balance && entry.balance_snapshot != null ? (
                    <span>{formatCurrency(entry.balance_snapshot)}</span>
                  ) : (
                    <span className="ghost-balance" title="Ghost balance — tick to make permanent">
                      {formatCurrency(entry.ghost_balance ?? entry.running_balance)}
                    </span>
                  )}
                </td>
                <td className="text-sm text-slate-500 dark:text-slate-400">{entry.created_by_name}</td>
                {canWrite && (
                  <td className="text-center">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => toggleBalance(entry)}
                        className={`rounded p-1 transition hover:shadow-sm ${
                          entry.show_balance
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                        title={entry.show_balance ? 'Balance is permanent — click to hide' : 'Make balance permanent'}
                      >
                        <Check size={16} />
                      </button>
                      {entry.show_balance && (
                        <button
                          onClick={() => toggleBalance(entry)}
                          className="rounded bg-slate-100 p-1 text-slate-500 transition hover:shadow-sm dark:bg-slate-700 dark:text-slate-300"
                          title="Hide permanent balance"
                        >
                          <X size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteTarget(entry)}
                        className="rounded bg-rose-50 p-1 text-rose-600 transition hover:bg-rose-100 hover:shadow-sm dark:bg-rose-900/30 dark:text-rose-400"
                        title="Delete entry"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <ConfirmModal
          title="Delete ledger entry?"
          message={`Remove "${deleteTarget.title}" (${formatDate(deleteTarget.entry_date)}, ${formatCurrency(deleteTarget.amount)})? This cannot be undone.`}
          confirmLabel={deleting ? 'Deleting...' : 'Delete'}
          onConfirm={handleDelete}
          onCancel={() => !deleting && setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </>
  );
}
