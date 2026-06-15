import { Link } from 'react-router-dom';

export default function Footer({ variant = 'default' }) {
  return (
    <footer
      className={`border-t border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900 ${
        variant === 'landing' ? '' : ''
      }`}
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 px-4 py-10 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <span className="logo-shell-sm">
            <img src="/logo-icon.png" alt="Arthiq" className="h-10 w-10 object-contain sm:h-12 sm:w-12" />
          </span>
          <div>
            <p className="text-lg font-semibold text-heading">Arthiq</p>
            <p className="text-xs text-muted">Smart Personal Finance Ledger</p>
          </div>
        </div>
        <p className="text-center text-sm text-muted">
          &copy; {new Date().getFullYear()} Arthiq. Track your finances the smart way.
        </p>
        <div className="flex gap-6 text-sm">
          <Link to="/" className="text-muted transition hover:text-teal-600 dark:hover:text-teal-400">
            Home
          </Link>
          <a href="#features" className="text-muted transition hover:text-teal-600 dark:hover:text-teal-400">
            Features
          </a>
        </div>
      </div>
    </footer>
  );
}
