import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BookOpen, Brain, Shield, Users, FileText, Share2, Lock,
  ArrowRight, Sparkles, TrendingUp, IndianRupee,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

const ACCENTS = ['feature-card-teal', 'feature-card-sky', 'feature-card-emerald'];

const features = [
  {
    icon: BookOpen,
    title: 'Classic Ledger Style',
    desc: 'Date, particulars, credit/debit, amount, and running balance — just like your old ledger book.',
    accent: ACCENTS[0],
    iconBox: 'icon-box-teal',
  },
  {
    icon: Brain,
    title: 'Smart Summaries',
    desc: 'Interactive bar charts, pie graphs, and monthly trends that reveal spending patterns instantly.',
    accent: ACCENTS[1],
    iconBox: 'icon-box-sky',
  },
  {
    icon: Lock,
    title: 'Password-Protected',
    desc: 'Each company ledger is locked with its own password — HOME, firm, or side projects stay separate.',
    accent: ACCENTS[2],
    iconBox: 'icon-box-emerald',
  },
  {
    icon: Share2,
    title: 'Team Sharing',
    desc: 'Invite others by email with Read, Write, or Full access — every entry shows who recorded it.',
    accent: ACCENTS[1],
    iconBox: 'icon-box-sky',
  },
  {
    icon: Users,
    title: 'Entry Attribution',
    desc: 'Know exactly who added each transaction — ideal for shared household or business finances.',
    accent: ACCENTS[2],
    iconBox: 'icon-box-emerald',
  },
  {
    icon: FileText,
    title: 'PDF Export',
    desc: 'Print authentic ledger-book PDFs for any date range — audit-ready and beautifully formatted.',
    accent: ACCENTS[0],
    iconBox: 'icon-box-teal',
  },
];

const steps = [
  { num: '01', title: 'Sign in', desc: 'Free Google OAuth — no passwords to remember.' },
  { num: '02', title: 'Create companies', desc: 'Home, business, projects — each with its own lock.' },
  { num: '03', title: 'Record entries', desc: 'Credit money in, debit money out, track every rupee.' },
  { num: '04', title: 'Analyze & export', desc: 'Charts, sharing, and PDF ledgers on demand.' },
];

const stats = [
  { label: 'Ledger format', value: 'Classic', icon: BookOpen, iconBox: 'icon-box-teal' },
  { label: 'Currency', value: '₹ INR', icon: IndianRupee, iconBox: 'icon-box-sky' },
  { label: 'Access roles', value: '3 types', icon: Users, iconBox: 'icon-box-emerald' },
  { label: 'Export', value: 'PDF', icon: FileText, iconBox: 'icon-box-teal' },
];

export default function Landing() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (searchParams.get('error') === 'auth_failed') {
      setAuthError('Google sign-in failed. Check OAuth settings and try again.');
      searchParams.delete('error');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return (
    <div className="landing-page min-h-screen overflow-x-hidden">
      <div className="landing-bg" aria-hidden="true">
        <div className="landing-orb landing-orb-green" />
        <div className="landing-orb landing-orb-purple" />
        <div className="landing-grid" />
      </div>

      <Header variant="landing" />

      <section className="relative px-4 pb-24 pt-10 sm:px-6 lg:px-8 lg:pb-32 lg:pt-16">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="order-2 lg:order-1">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5 text-sm text-teal-800 dark:border-teal-700 dark:bg-teal-900/40 dark:text-teal-200">
              <Sparkles size={14} />
              Smart finance for Indian households
            </div>
            <h1 className="text-heading mb-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Your money,{' '}
              <span className="gradient-text">recorded</span>
              <br />
              the way ledgers were meant to be.
            </h1>
            <p className="text-body mb-8 max-w-lg text-lg leading-relaxed">
              Arthiq blends the familiarity of traditional ledger books with intelligent summaries,
              secure sharing, and beautiful PDF exports — all in one place.
            </p>
            {authError && (
              <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
                {authError}
              </div>
            )}
            <div className="flex flex-wrap gap-4">
              {user ? (
                <Link to="/dashboard" className="btn-primary group flex items-center gap-2 !px-8 !py-3.5 text-base">
                  Open Dashboard
                  <ArrowRight size={18} className="transition group-hover:translate-x-1" />
                </Link>
              ) : (
                <a href="/api/auth/google" className="btn-primary group flex items-center gap-2 !px-8 !py-3.5 text-base">
                  Get Started Free
                  <ArrowRight size={18} className="transition group-hover:translate-x-1" />
                </a>
              )}
              <a href="#features" className="btn-secondary flex items-center gap-2 !px-8 !py-3.5 text-base">
                Explore Features
              </a>
            </div>
          </div>

          <div className="order-1 hidden justify-center lg:order-2 lg:flex">
            <span className="logo-shell-lg">
              <img
                src="/logo-icon.png"
                alt="Arthiq logo"
                className="h-56 w-56 object-contain lg:h-72 lg:w-72"
              />
            </span>
          </div>
        </div>

        <div className="mx-auto mt-20 grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="glass-card feature-card-teal text-center">
              <s.icon className={`mx-auto mb-2 inline-flex rounded-lg p-1.5 ${s.iconBox}`} size={22} />
              <p className="text-heading text-lg font-bold">{s.value}</p>
              <p className="text-muted text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <p className="text-muted mb-2 text-sm font-medium uppercase tracking-widest">Features</p>
            <h2 className="text-heading text-3xl font-bold sm:text-4xl">
              Everything you need,{' '}
              <span className="gradient-text">nothing you don&apos;t</span>
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div
                key={f.title}
                className={`glass-card group ${f.accent} ${i === 0 ? 'lg:col-span-2' : ''}`}
              >
                <div className="relative z-[1]">
                  <div className={`mb-4 inline-flex rounded-xl p-3 ${f.iconBox}`}>
                    <f.icon size={28} />
                  </div>
                  <h3 className="text-heading mb-2 text-lg font-semibold">{f.title}</h3>
                  <p className="text-body text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <p className="mb-1 text-sm font-medium uppercase tracking-widest text-teal-700 dark:text-teal-400">
                How it works
              </p>
              <h2 className="text-heading text-3xl font-bold">Up and running in minutes</h2>
            </div>
            <TrendingUp className="hidden text-teal-600 dark:text-teal-400 sm:block" size={40} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <div
                key={step.num}
                className={`glass-card group border-l-2 pl-5 ${
                  i % 3 === 0 ? 'border-l-teal-600' : i % 3 === 1 ? 'border-l-sky-600' : 'border-l-emerald-600'
                }`}
              >
                <span className="text-3xl font-black text-teal-200 dark:text-teal-800">{step.num}</span>
                <h3 className="text-heading mt-2 font-semibold">{step.title}</h3>
                <p className="text-body mt-1 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="glass-card feature-card-sky overflow-hidden !p-0">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-400/80" />
                <div className="h-3 w-3 rounded-full bg-amber-400/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-400/80" />
                <span className="text-muted ml-3 text-sm">Home Expenses — Ledger</span>
              </div>
            </div>
            <div className="overflow-x-auto p-4 sm:p-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted border-b border-slate-200 text-left text-xs uppercase tracking-wider dark:border-slate-700">
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3 pr-4">Particulars</th>
                    <th className="pb-3 pr-4 text-center">+/-</th>
                    <th className="pb-3 pr-4 text-right">Amount</th>
                    <th className="pb-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="text-body">
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-3 pr-4">12 Jun</td>
                    <td className="py-3 pr-4">Salary credited</td>
                    <td className="py-3 pr-4 text-center text-emerald-600 dark:text-emerald-400">+</td>
                    <td className="py-3 pr-4 text-right font-mono">₹45,000</td>
                    <td className="py-3 text-right font-mono">₹45,000</td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-3 pr-4">12 Jun</td>
                    <td className="py-3 pr-4">Grocery — Big Bazaar</td>
                    <td className="py-3 pr-4 text-center text-rose-600 dark:text-rose-400">-</td>
                    <td className="py-3 pr-4 text-right font-mono">₹2,340</td>
                    <td className="py-3 text-right font-mono ghost-balance">₹42,660</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4">11 Jun</td>
                    <td className="py-3 pr-4">Electricity bill</td>
                    <td className="py-3 pr-4 text-center text-rose-600 dark:text-rose-400">-</td>
                    <td className="py-3 pr-4 text-right font-mono">₹1,890</td>
                    <td className="py-3 text-right font-mono">₹40,770</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-muted border-t border-slate-200 px-6 py-3 text-center text-xs dark:border-slate-700">
              Ghost balances shown faintly until you tick ✓ to make them permanent
            </p>
          </div>
        </div>
      </section>

      <section className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="glass-card feature-card-emerald mx-auto max-w-2xl">
            <Shield className="mx-auto mb-4 text-teal-700 dark:text-teal-400" size={44} />
            <h2 className="text-heading mb-3 text-2xl font-bold sm:text-3xl">Secure by design</h2>
            <p className="text-body mb-8">
              Google OAuth, password-protected ledgers, role-based sharing, and HTTP-only cookies.
              Your financial records stay private and under your control.
            </p>
            {!user && (
              <a href="/api/auth/google" className="btn-primary inline-flex items-center gap-2 !px-8 !py-3">
                Start your ledger today
                <ArrowRight size={18} />
              </a>
            )}
          </div>
        </div>
      </section>

      <Footer variant="landing" />
    </div>
  );
}
