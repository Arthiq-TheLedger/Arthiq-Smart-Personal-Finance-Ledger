import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, BarChart3, Users, FileDown } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UnlockModal from '../components/UnlockModal';
import EntryForm from '../components/EntryForm';
import LedgerTable from '../components/LedgerTable';
import SummaryCharts from '../components/SummaryCharts';
import SharePanel from '../components/SharePanel';
import PdfExport from '../components/PdfExport';
import api, { clearUnlockToken, clearAllUnlockTokens } from '../utils/api';

const tabs = [
  { id: 'ledger', label: 'Ledger', icon: BookOpen },
  { id: 'summary', label: 'Summary', icon: BarChart3 },
  { id: 'share', label: 'Share', icon: Users },
  { id: 'export', label: 'Export PDF', icon: FileDown },
];

export default function Company() {
  const { id } = useParams();
  const navigate = useNavigate();
  const companyId = parseInt(id);
  const [company, setCompany] = useState(null);
  const [tab, setTab] = useState('ledger');
  const [unlocked, setUnlocked] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clearUnlockToken(companyId);
    setUnlocked(false);
    setShowUnlock(false);

    api
      .get('/companies')
      .then((res) => {
        const c = res.data.find((x) => x.id === companyId);
        setCompany(c);
        if (c) setShowUnlock(true);
      })
      .finally(() => setLoading(false));

    return () => {
      clearUnlockToken(companyId);
    };
  }, [companyId]);

  const handleBackToDashboard = () => {
    clearUnlockToken(companyId);
    clearAllUnlockTokens();
    navigate('/dashboard');
  };

  const loadEntries = useCallback(() => {
    if (!unlocked) return;
    api.get(`/ledger/${companyId}`).then((res) => setEntries(res.data)).catch(() => {
      clearUnlockToken(companyId);
      setUnlocked(false);
      setShowUnlock(true);
    });
  }, [companyId, unlocked]);

  const loadSummary = useCallback(() => {
    if (!unlocked) return;
    api.get(`/ledger/${companyId}/summary`).then((res) => setSummary(res.data));
  }, [companyId, unlocked]);

  useEffect(() => {
    if (unlocked) {
      loadEntries();
      if (tab === 'summary') loadSummary();
    }
  }, [unlocked, tab, loadEntries, loadSummary]);

  const canWrite = company?.is_owner || company?.role === 'write' || company?.role === 'both';
  const canRead =
    company?.is_owner || company?.role === 'read' || company?.role === 'both' || company?.role === 'write';
  const canViewSummary = company?.is_owner || company?.role === 'read' || company?.role === 'both';

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-body">Company not found</p>
        <Link to="/dashboard" className="btn-primary" onClick={handleBackToDashboard}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        <Link
          to="/dashboard"
          onClick={handleBackToDashboard}
          className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-teal-700 dark:hover:text-teal-400"
        >
          <ArrowLeft size={16} /> Back to Companies
        </Link>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-heading text-2xl font-bold">{company.name}</h1>
            {company.description && <p className="text-muted">{company.description}</p>}
          </div>
          <div className="flex gap-1 rounded-lg border border-slate-200 p-1 dark:border-slate-700">
            {tabs.map((t) => {
              if (t.id === 'share' && !company.is_owner) return null;
              if (t.id === 'ledger' && !canRead) return null;
              if ((t.id === 'summary' || t.id === 'export') && !canViewSummary) return null;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm transition ${
                    tab === t.id ? 'tab-active' : 'tab-inactive'
                  }`}
                >
                  <t.icon size={16} />
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {tab === 'ledger' && unlocked && (
          <>
            {canWrite && <EntryForm companyId={companyId} onAdded={loadEntries} />}
            <LedgerTable
              entries={entries}
              companyId={companyId}
              canWrite={canWrite}
              onUpdate={loadEntries}
            />
          </>
        )}

        {tab === 'summary' && unlocked && <SummaryCharts summary={summary} />}
        {tab === 'share' && unlocked && <SharePanel companyId={companyId} isOwner={company.is_owner} />}
        {tab === 'export' && unlocked && <PdfExport companyId={companyId} companyName={company.name} />}
      </main>
      <Footer />

      {showUnlock && !unlocked && (
        <UnlockModal
          companyId={companyId}
          companyName={company.name}
          onUnlocked={() => {
            setUnlocked(true);
            setShowUnlock(false);
          }}
          onCancel={handleBackToDashboard}
        />
      )}
    </div>
  );
}
