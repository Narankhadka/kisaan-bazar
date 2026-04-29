import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';

const DAY_OPTIONS = [7, 15, 30];

function ChartSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex gap-2 mb-4">
        {DAY_OPTIONS.map(d => (
          <div key={d} className="h-7 w-14 bg-gray-200 rounded-full" />
        ))}
      </div>
      <div className="h-52 bg-gray-200 rounded-xl" />
      <div className="flex justify-center gap-6 mt-3">
        {[1, 2, 3].map(i => <div key={i} className="h-3 w-12 bg-gray-200 rounded" />)}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label, t }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2.5 text-xs min-w-[110px]">
      <p className="font-semibold text-gray-600 mb-1.5">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-medium leading-5">
          {t(`chart.${p.dataKey}`)}: {t('currency')}{p.value}
        </p>
      ))}
    </div>
  );
}

export default function PriceHistoryChart({ cropId }) {
  const { t, lang } = useLanguage();
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days,    setDays]    = useState(30);

  useEffect(() => {
    if (!cropId) return;
    setLoading(true);
    const controller = new AbortController();
    api.get(`/prices/history/${cropId}/`, { params: { page_size: 31 }, signal: controller.signal })
      .then(({ data: res }) => {
        const rows = res.results ?? (Array.isArray(res) ? res : []);
        // backend returns descending; sort ascending for chart
        const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
        setAllData(sorted);
      })
      .catch(() => setAllData([]))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [cropId]);

  if (loading) return <ChartSkeleton />;

  const filtered = allData.slice(-days);

  if (filtered.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-gray-400">{t('chart.empty')}</p>
      </div>
    );
  }

  const locale = lang === 'ne' ? 'ne-NP' : 'en-US';
  const fmtShort = dateStr =>
    new Date(dateStr).toLocaleDateString(locale, { month: 'short', day: 'numeric' });

  const chartData = filtered.map(row => ({
    label: fmtShort(row.date),
    avg: parseFloat(row.avg_price),
    min: parseFloat(row.min_price),
    max: parseFloat(row.max_price),
  }));

  return (
    <div>
      {/* Day toggle */}
      <div className="flex gap-2 mb-4">
        {DAY_OPTIONS.map(d => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
            style={days === d
              ? { backgroundColor: '#1a6b2e', color: 'white', borderColor: '#1a6b2e' }
              : { backgroundColor: 'white', color: '#374151', borderColor: '#d1d5db' }
            }
          >
            {t(`chart.days_${d}`)}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            interval="preserveStartEnd"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            width={38}
          />
          <Tooltip content={<CustomTooltip t={t} />} />
          <Legend
            formatter={value => t(`chart.${value}`)}
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          />
          <Line
            type="monotone" dataKey="avg"
            stroke="#1a6b2e" strokeWidth={2.5}
            dot={false} activeDot={{ r: 4, fill: '#1a6b2e' }}
          />
          <Line
            type="monotone" dataKey="min"
            stroke="#3b82f6" strokeWidth={1.5}
            dot={false} activeDot={{ r: 3 }}
            strokeDasharray="5 3"
          />
          <Line
            type="monotone" dataKey="max"
            stroke="#f97316" strokeWidth={1.5}
            dot={false} activeDot={{ r: 3 }}
            strokeDasharray="5 3"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
