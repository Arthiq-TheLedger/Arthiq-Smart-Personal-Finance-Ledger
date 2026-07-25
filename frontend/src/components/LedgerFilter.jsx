import { Filter, X } from 'lucide-react';

export default function LedgerFilter({ filters, onChange, onApply, onClear, hasActiveFilters }) {
  return (
    <div className="card mb-4">
      <div className="mb-3 flex items-center gap-2">
        <Filter size={18} className="text-teal-600 dark:text-teal-400" />
        <h3 className="text-heading font-semibold">Filter Entries</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          type="text"
          placeholder="Search particular (e.g. groceries)"
          value={filters.title}
          onChange={(e) => onChange({ ...filters, title: e.target.value })}
          className="input-field lg:col-span-2"
        />
        <input
          type="date"
          value={filters.from}
          onChange={(e) => onChange({ ...filters, from: e.target.value })}
          className="input-field"
          title="From date"
        />
        <input
          type="date"
          value={filters.to}
          onChange={(e) => onChange({ ...filters, to: e.target.value })}
          className="input-field"
          title="To date"
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={onApply} className="btn-primary text-sm !px-4 !py-2">
          Apply Filters
        </button>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            className="btn-secondary flex items-center gap-1 text-sm !px-4 !py-2"
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>
      <p className="text-muted mt-2 text-xs">
        Filter by item name and date range — e.g. all &quot;Petrol&quot; entries from 24 Jun 2026 to 24 Jul 2026
      </p>
    </div>
  );
}
