import { CheckCircle2, XCircle, Clock, Eye } from 'lucide-react';

const STATUS_STYLES = {
  Pending: { icon: Clock, bg: 'bg-amber-500/15', border: 'border-amber-500/20', text: 'text-amber-400' },
  'Under Review': { icon: Eye, bg: 'bg-violet-500/15', border: 'border-violet-500/20', text: 'text-violet-400' },
  Approved: { icon: CheckCircle2, bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', text: 'text-emerald-400' },
  Denied: { icon: XCircle, bg: 'bg-rose-500/15', border: 'border-rose-500/20', text: 'text-rose-400' },
};

export default function AppealAnalytics({ appeals, logs }) {
  const byStatus = {};
  appeals.forEach((a) => {
    const s = a.status || 'Pending';
    byStatus[s] = (byStatus[s] || 0) + 1;
  });

  const decided = (byStatus.Approved || 0) + (byStatus.Denied || 0);
  const approved = byStatus.Approved || 0;
  const approvalRate = decided > 0 ? Math.round((approved / decided) * 100) : 0;

  const appealHandlers = {};
  logs.filter((l) => l.action === 'appeal_decision').forEach((l) => {
    const s = l.staff_username || 'Unknown';
    appealHandlers[s] = (appealHandlers[s] || 0) + 1;
  });
  const sortedHandlers = Object.entries(appealHandlers).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const maxHandler = Math.max(1, ...sortedHandlers.map((e) => e[1]));

  return (
    <div className="mt-8 grid sm:grid-cols-2 gap-6">
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Appeals by status</h2>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(STATUS_STYLES).map(([status, style]) => {
            const Icon = style.icon;
            const count = byStatus[status] || 0;
            return (
              <div key={status} className={`rounded-xl ${style.bg} ${style.border} border p-3`}>
                <Icon className={`h-4 w-4 ${style.text} mb-2`} />
                <div className="text-2xl font-bold text-white">{count}</div>
                <div className="text-xs text-slate-400 mt-0.5">{status}</div>
              </div>
            );
          })}
        </div>
        {decided > 0 && (
          <div className="mt-4 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/15 p-3 flex items-center justify-between">
            <span className="text-sm text-slate-300">Approval rate</span>
            <span className="text-lg font-bold text-emerald-300">{approvalRate}%</span>
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Staff who reviewed appeals</h2>
        {sortedHandlers.length === 0 ? (
          <p className="text-sm text-slate-500">No appeal decisions logged yet.</p>
        ) : (
          <div className="space-y-2.5">
            {sortedHandlers.map(([staff, count], i) => (
              <div key={staff} className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-300 truncate">{staff}</span>
                    <span className="text-sm font-semibold text-white ml-2">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full bg-violet-400" style={{ width: `${(count / maxHandler) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}