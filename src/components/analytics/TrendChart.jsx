import { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function TrendChart({ moderations, appeals }) {
  const data = useMemo(() => {
    const days = 30;
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    const buckets = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      buckets.push({
        date: d,
        key: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        moderations: 0,
        appeals: 0,
      });
    }
    const map = new Map(buckets.map((b) => [b.key, b]));
    moderations.forEach((m) => {
      const key = m.moderation_date ? new Date(m.moderation_date).toISOString().slice(0, 10) : null;
      if (key && map.has(key)) map.get(key).moderations++;
    });
    appeals.forEach((a) => {
      const key = a.created_date ? new Date(a.created_date).toISOString().slice(0, 10) : null;
      if (key && map.has(key)) map.get(key).appeals++;
    });
    return buckets;
  }, [moderations, appeals]);

  const totalMods = data.reduce((s, d) => s + d.moderations, 0);
  const totalApps = data.reduce((s, d) => s + d.appeals, 0);
  const peakDay = data.reduce((max, d) => (d.moderations + d.appeals > max.moderations + max.appeals ? d : max), data[0]);

  return (
    <div className="mt-8 rounded-2xl bg-white/[0.03] border border-white/10 p-6">
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp className="h-5 w-5 text-cyan-400" />
        <h2 className="text-lg font-semibold text-white">30-day activity trend</h2>
      </div>
      <p className="text-sm text-slate-400 mb-4">
        {totalMods} moderations and {totalApps} appeals in the last 30 days
        {peakDay && (peakDay.moderations + peakDay.appeals) > 0 && ` · peak on ${peakDay.label}`}
      </p>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="modGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="appGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="label"
              tick={{ fill: '#64748b', fontSize: 11 }}
              interval={4}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: '#0f172a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
            <Area
              type="monotone"
              dataKey="moderations"
              name="Moderations"
              stroke="#06b6d4"
              strokeWidth={2}
              fill="url(#modGrad)"
            />
            <Area
              type="monotone"
              dataKey="appeals"
              name="Appeals"
              stroke="#a78bfa"
              strokeWidth={2}
              fill="url(#appGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}