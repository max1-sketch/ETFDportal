import { useMemo } from 'react';
import { Scale, TrendingDown, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

// Staff Audit & Consistency Score — compares each staff member's approval/denial
// rates against the team average to flag harsh or overly lenient reviewers.
export default function StaffAudit({ moderations, appeals, logs }) {
  const staffStats = useMemo(() => {
    const byStaff = {};
    const add = (name) => {
      if (!name) return null;
      if (!byStaff[name]) byStaff[name] = { name, issued: 0, approved: 0, denied: 0, total: 0 };
      return byStaff[name];
    };

    moderations.forEach((m) => { if (m.staff_member) add(m.staff_member).issued++; });

    logs.forEach((l) => {
      if (l.action !== 'appeal_decision' || !l.staff_username) return;
      const s = add(l.staff_username);
      s.total++;
      const d = (l.detail || '').toLowerCase();
      if (d.includes('approv')) s.approved++;
      else if (d.includes('deni') || d.includes('reject')) s.denied++;
    });

    const arr = Object.values(byStaff).filter((s) => s.total > 0);
    const teamApproved = arr.reduce((a, s) => a + s.approved, 0);
    const teamDenied = arr.reduce((a, s) => a + s.denied, 0);
    const teamDecisions = teamApproved + teamDenied;
    const teamApproveRate = teamDecisions ? (teamApproved / teamDecisions) * 100 : 0;
    const teamDenyRate = teamDecisions ? (teamDenied / teamDecisions) * 100 : 0;

    return arr
      .map((s) => {
        const decided = s.approved + s.denied;
        const approveRate = decided ? (s.approved / decided) * 100 : 0;
        const denyRate = decided ? (s.denied / decided) * 100 : 0;
        const approveDelta = approveRate - teamApproveRate;
        const denyDelta = denyRate - teamDenyRate;
        let verdict = 'Balanced';
        let verdictColor = 'emerald';
        if (decided >= 3) {
          if (approveDelta > 20) { verdict = 'Lenient'; verdictColor = 'amber'; }
          else if (denyDelta > 20) { verdict = 'Harsh'; verdictColor = 'rose'; }
        }
        return { ...s, decided, approveRate, denyRate, approveDelta, denyDelta, verdict, verdictColor };
      })
      .sort((a, b) => b.issued - a.issued);
  }, [moderations, logs]);

  if (staffStats.length === 0) {
    return (
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6">
        <div className="flex items-center gap-2 mb-1">
          <Scale className="h-5 w-5 text-cyan-400" />
          <h3 className="text-base font-semibold text-white">Staff Audit & Consistency</h3>
        </div>
        <p className="text-sm text-slate-500 mt-2">No appeal decisions logged yet.</p>
      </div>
    );
  }

  const colorMap = {
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
    rose: 'bg-rose-500/15 text-rose-300 border-rose-500/25',
  };

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6">
      <div className="flex items-center gap-2 mb-1">
        <Scale className="h-5 w-5 text-cyan-400" />
        <h3 className="text-base font-semibold text-white">Staff Audit & Consistency</h3>
      </div>
      <p className="text-xs text-slate-500 mb-4">Approval/denial rates vs. team average. Flags reviewers who deviate significantly.</p>

      <div className="space-y-2.5">
        {staffStats.map((s) => (
          <div key={s.name} className="rounded-xl bg-slate-900/40 border border-white/5 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-white truncate">{s.name}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {s.issued} issued · {s.decided} decided ({s.approved}✓ / {s.denied}✗)
                </div>
              </div>
              <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${colorMap[s.verdictColor]}`}>
                {s.verdictColor === 'rose' && <AlertTriangle className="h-2.5 w-2.5" />}
                {s.verdictColor === 'emerald' && <CheckCircle2 className="h-2.5 w-2.5" />}
                {s.verdict}
              </span>
            </div>
            {s.decided > 0 && (
              <div className="mt-2 flex items-center gap-3 text-[11px]">
                <span className="inline-flex items-center gap-1 text-emerald-400">
                  <TrendingUp className="h-3 w-3" /> {s.approveRate.toFixed(0)}% approve
                  {s.approveDelta > 5 && <span className="text-amber-400">(+{s.approveDelta.toFixed(0)}%)</span>}
                </span>
                <span className="inline-flex items-center gap-1 text-rose-400">
                  <TrendingDown className="h-3 w-3" /> {s.denyRate.toFixed(0)}% deny
                  {s.denyDelta > 5 && <span className="text-amber-400">(+{s.denyDelta.toFixed(0)}%)</span>}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}