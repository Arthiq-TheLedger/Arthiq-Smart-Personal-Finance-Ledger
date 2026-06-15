import { Link } from 'react-router-dom';
import { Moon, Sun, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Header({ showAuth = true, variant = 'default' }) {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const isLanding = variant === 'landing';

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b transition-colors duration-300 ${
        isLanding
          ? 'border-slate-200 bg-white/95 dark:border-slate-700 dark:bg-slate-900/95'
          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
      }`}
    >
      <div className="flex w-full items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
        <Link to="/" className="group flex shrink-0 items-center" aria-label="Arthiq home">
          <span className="logo-shell transition-transform group-hover:scale-[1.02]">
            <img
              src="/logo-full.png"
              alt="Arthiq — Smart Personal Finance Ledger"
              className="h-9 w-auto object-contain sm:h-11 lg:h-12"
              style={{ maxWidth: 'min(260px, 50vw)' }}
            />
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggle}
            className="rounded-lg p-2.5 text-slate-600 transition hover:bg-slate-100 hover:shadow-sm dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {showAuth && (
            <>
              {user ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  {user.avatar_url && (
                    <img src={user.avatar_url} alt="" className="hidden h-8 w-8 rounded-full sm:block" />
                  )}
                  <span className="hidden text-sm text-slate-700 dark:text-slate-200 md:inline">{user.name}</span>
                  <Link to="/dashboard" className="btn-primary text-sm !px-4 !py-2">
                    Dashboard
                  </Link>
                  <button
                    onClick={logout}
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:shadow-sm dark:text-slate-400 dark:hover:bg-slate-800"
                    title="Logout"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <a href="/api/auth/google" className="btn-primary text-sm !px-4 !py-2 sm:!px-5">
                  <span className="hidden sm:inline">Sign in with Google</span>
                  <span className="sm:hidden">Sign in</span>
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
