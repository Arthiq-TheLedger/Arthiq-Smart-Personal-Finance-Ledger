import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { formatCurrency } from '../utils/format';
import { useTheme } from '../context/ThemeContext';

const COLORS = ['#059669', '#475569', '#0f766e', '#64748b', '#dc2626', '#0369a1'];

function truncateLabel(text, max = 14) {
  if (!text || text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function formatAxisAmount(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}k`;
  return `₹${n}`;
}

function formatMonthLabel(month) {
  if (!month) return '';
  const [year, m] = month.split('-');
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${names[parseInt(m, 10) - 1] || m} '${year?.slice(2) || ''}`;
}

export default function SummaryCharts({ summary }) {
  const { dark } = useTheme();

  const chartTheme = useMemo(
    () => ({
      tick: dark ? '#cbd5e1' : '#475569',
      grid: dark ? '#334155' : '#e2e8f0',
      tooltipBg: dark ? '#1e293b' : '#ffffff',
      tooltipBorder: dark ? '#475569' : '#e2e8f0',
      tooltipText: dark ? '#f1f5f9' : '#0f172a',
      legend: dark ? '#e2e8f0' : '#334155',
    }),
    [dark]
  );

  if (!summary) return null;

  const pieData = [
    { name: 'Received', value: summary.totalCredit },
    { name: 'Spent', value: summary.totalDebit },
  ].filter((d) => d.value > 0);

  const topExpenses = [...summary.byTitle]
    .sort((a, b) => b.debit - a.debit)
    .slice(0, 8)
    .map((t) => ({
      name: truncateLabel(t.title, 18),
      fullName: t.title,
      debit: t.debit,
    }));

  const monthlyData = summary.byMonth.map((m) => ({
    ...m,
    monthLabel: formatMonthLabel(m.month),
  }));

  const yAxisWidth = Math.min(160, Math.max(72, ...topExpenses.map((e) => e.name.length * 6.5)));

  const tooltipStyle = {
    backgroundColor: chartTheme.tooltipBg,
    border: `1px solid ${chartTheme.tooltipBorder}`,
    borderRadius: '8px',
    color: chartTheme.tooltipText,
    fontSize: '12px',
  };

  const axisTick = { fill: chartTheme.tick, fontSize: 11 };
  const legendStyle = { color: chartTheme.legend, fontSize: '12px' };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card text-center">
          <p className="text-muted text-sm">Total Received</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(summary.totalCredit)}</p>
        </div>
        <div className="card text-center">
          <p className="text-muted text-sm">Total Spent</p>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{formatCurrency(summary.totalDebit)}</p>
        </div>
        <div className="card text-center">
          <p className="text-muted text-sm">Net Balance</p>
          <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatCurrency(summary.balance)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="text-heading mb-4 font-semibold">Credit vs Debit</h3>
          {pieData.length === 0 ? (
            <p className="text-muted py-12 text-center text-sm">No data to display</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} stroke={chartTheme.tooltipBg} strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={tooltipStyle} />
                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={legendStyle}
                  formatter={(value) => <span style={{ color: chartTheme.legend }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 className="text-heading mb-4 font-semibold">Monthly Trend</h3>
          {monthlyData.length === 0 ? (
            <p className="text-muted py-12 text-center text-sm">No monthly data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
                <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" />
                <XAxis
                  dataKey="monthLabel"
                  tick={axisTick}
                  interval="preserveStartEnd"
                  angle={monthlyData.length > 6 ? -35 : 0}
                  textAnchor={monthlyData.length > 6 ? 'end' : 'middle'}
                  height={monthlyData.length > 6 ? 56 : 30}
                />
                <YAxis tick={axisTick} tickFormatter={formatAxisAmount} width={52} />
                <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={tooltipStyle} />
                <Legend wrapperStyle={legendStyle} />
                <Line type="monotone" dataKey="credit" stroke="#059669" name="Credit" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="debit" stroke="#dc2626" name="Debit" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {topExpenses.length > 0 && (
        <div className="card">
          <h3 className="text-heading mb-4 font-semibold">Top Expenses by Category</h3>
          <ResponsiveContainer width="100%" height={Math.max(280, topExpenses.length * 36 + 40)}>
            <BarChart data={topExpenses} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
              <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={axisTick} tickFormatter={formatAxisAmount} />
              <YAxis
                type="category"
                dataKey="name"
                width={yAxisWidth}
                tick={axisTick}
                interval={0}
              />
              <Tooltip
                formatter={(v) => formatCurrency(v)}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
                contentStyle={tooltipStyle}
              />
              <Bar dataKey="debit" fill="#475569" name="Debit" radius={[0, 4, 4, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
