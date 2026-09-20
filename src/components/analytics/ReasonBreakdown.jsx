import { useMemo } from 'react';
import { Flag } from 'lucide-react';

export default function ReasonBreakdown({ moderations }) {
  const reasons = useMemo(() => {
    const map = {};
    moderations.forEach((m) => {
      const r = (m.reason || '').trim() || '(no reason given)';
      map[r] = (map[r] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [moderations]);

  const maxCount = Math.max(1, ...reasons.map((e) => e[1]));

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Flag className="h-5 w-5 text-amber-400" />
        <h2 className="text-lg font-semibold text-white">Top moderation reasons</h2>
      </div>
      {reasons.length === 0 ? (
        <p className="text-sm text-slate-500">No moderations yet.</p>
      ) : (
        <div className="space-y-3">
          {reasons.map(([reason, count], i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 w-5 shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1 gap-2">
                  <span className="text-sm text-slate-300 truncate">{reason}</span>
                  <span className="text-sm font-semibold text-white shrink-0">{count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}