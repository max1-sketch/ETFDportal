import { ShieldBan, AlertTriangle, Activity, Layers } from 'lucide-react';

export default function QuickStats({ list }) {
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;

  const activeBans = list.filter((m) => m.status === 'Active' && m.moderation_type.includes('Ban')).length;
  const totalWarnings = list.filter((m) => m.moderation_type === 'Warning').length;
  const last24h = list.filter((m) => {
    const d = m.moderation_date ? new Date(m.moderation_date).getTime() : 0;
    return d >= dayAgo;
  }).length;
  const total = list.length;

  const stats = [
    { label: 'Active Bans', value: activeBans, icon: ShieldBan, cls: 'text-rose-300', bg: 'bg-rose-500/10 border-rose-500/20', ring: 'group-hover:border-rose-500/40' },
    { label: 'Warnings', value: totalWarnings, icon: AlertTriangle, cls: 'text-amber-300', bg: 'bg-amber-500/10 border-amber-500/20', ring: 'group-hover:border-amber-500/40' },
    { label: 'Actions (24h)', value: last24h, icon: Activity, cls: 'text-cyan-300', bg: 'bg-cyan-500/10 border-cyan-500/20', ring: 'group-hover:border-cyan-500/40' },
    { label: 'Total Records', value: total, icon: Layers, cls: 'text-white', bg: 'bg-white/5 border-white/10', ring: 'group-hover:border-white/20' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className={`group rounded-2xl border p-4 transition-all ${s.bg} ${s.ring}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">{s.label}</span>
              <div className="h-7 w-7 rounded-lg bg-white/5 flex items-center justify-center">
                <Icon className={`h-3.5 w-3.5 ${s.cls}`} />
              </div>
            </div>
            <div className={`text-3xl font-bold ${s.cls}`}>{s.value}</div>
          </div>
        );
      })}
    </div>
  );
}