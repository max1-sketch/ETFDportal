import { ShieldCheck, Ban, FileText, Activity } from 'lucide-react';

const COLOR_STYLES = {
  cyan: { bg: 'bg-cyan-500/15', border: 'border-cyan-500/20', text: 'text-cyan-400' },
  rose: { bg: 'bg-rose-500/15', border: 'border-rose-500/20', text: 'text-rose-400' },
  violet: { bg: 'bg-violet-500/15', border: 'border-violet-500/20', text: 'text-violet-400' },
  emerald: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', text: 'text-emerald-400' },
};

export default function AnalyticsStats({ moderations, appeals, logs }) {
  const totalBans = moderations.filter(
    (m) => m.moderation_type === 'Temporary Ban' || m.moderation_type === 'Permanent Ban'
  ).length;

  const stats = [
    { icon: ShieldCheck, label: 'Total Moderations', value: moderations.length, color: 'cyan' },
    { icon: Ban, label: 'Total Bans', value: totalBans, color: 'rose' },
    { icon: FileText, label: 'Total Appeals', value: appeals.length, color: 'violet' },
    { icon: Activity, label: 'Staff Actions', value: logs.length, color: 'emerald' },
  ];

  return (
    <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((s) => {
        const c = COLOR_STYLES[s.color];
        return (
          <div key={s.label} className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
            <div className={`h-9 w-9 rounded-xl ${c.bg} ${c.border} border flex items-center justify-center mb-3`}>
              <s.icon className={`h-4 w-4 ${c.text}`} />
            </div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
          </div>
        );
      })}
    </div>
  );
}