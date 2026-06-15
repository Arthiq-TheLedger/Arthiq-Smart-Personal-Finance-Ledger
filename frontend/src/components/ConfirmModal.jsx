export default function ConfirmModal({ title, message, confirmLabel = 'Delete', onConfirm, onCancel, danger = true, loading = false }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="card mx-auto w-full max-w-md shadow-xl">
        <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">{message}</p>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="btn-secondary flex-1" disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-lg px-4 py-2.5 font-medium text-white transition-all duration-200 hover:-translate-y-px ${
              danger
                ? 'bg-rose-600 hover:bg-rose-700 hover:shadow-md hover:shadow-rose-600/30'
                : 'btn-primary'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
