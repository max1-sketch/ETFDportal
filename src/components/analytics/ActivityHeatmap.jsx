import { useMemo } from 'react';
import { CalendarClock } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ActivityHeatmap({ moderations, appeals }) {
  const grid = useMemo(() => {
    // 7 days × 24 hours
    const g = Array.from({ length: 7 }, () => Array(24).fill(0));
    moderations.forEach((m) => {
      const d = m.moderation_date || m.created_date;
      if (!d) return;
      const date = new Date(d);
      g[date.getDay()][date.getHours()]++;
    });
    appeals.forEach((a) => {
      const d = a.created_date;
      if (!d) return;
      const date = new Date(d);
      g[date.getDay()][date.getHours()]++;
    });
    return g;
  }, [moderations, appeals]);

  const max = useMemo(() => Math.max(1, ...grid.flat()), [grid]);

  const colorFor = (v) => {
    if (v === 0) return 'bg-white/[0.03]';
    const intensity = Math.min(1, v / max);
    if (intensity > 0.75) return 'bg-cyan-500';
    if (intensity > 0.5) return 'bg-cyan-500/70';
    if (intensity > 0.25) return 'bg-cyan-500/40';
    return 'bg-cyan-500/20';
  };

  const peakHour = useMemo(() => {
    let best = { day: 0, hour: 0, val: 0 };
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        if (grid[d][h] > best.val) best = { day: d, hour: h, val: grid[d][h] };
      }
    }
    return best;
  }, [grid]);

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6">
      <div className="flex items-center gap-2 mb-1">
        <CalendarClock className="h-5 w-5 text-violet-400" />
        <h2 className="text-lg font-semibold text-white">Activity heatmap</h2>
      </div>
      <p className="text-sm text-slate-400 mb-4">
        Moderation & appeal activity by day and hour
        {peakHour.val > 0 && ` · peak: ${DAYS[peakHour.day]} ${peakHour.hour}:00 (${peakHour.val})`}
      </p>
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Hour labels */}
          <div className="flex items-center gap-px mb-1 ml-10">
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="w-6 text-center text-[9px] text-slate-600">
                {h % 3 === 0 ? h : ''}
              </div>
            ))}
          </div>
          {/* Grid rows */}
          {grid.map((row, d) => (
            <div key={d} className="flex items-center gap-px mb-px">
              <div className="w-9 text-[10px] text-slate-500 text-right pr-1.5 shrink-0">{DAYS[d]}</div>
              {row.map((v, h) => (
                <div
                  key={h}
                  className={`w-6 h-6 rounded-sm ${colorFor(v)} border border-white/[0.02]`}
                  title={`${DAYS[d]} ${h}:00 — ${v} actions`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 text-xs text-slate-500">
        <span>Less</span>
        <div className="flex gap-px">
          <div className="w-4 h-4 rounded-sm bg-white/[0.03]" />
          <div className="w-4 h-4 rounded-sm bg-cyan-500/20" />
          <div className="w-4 h-4 rounded-sm bg-cyan-500/40" />
          <div className="w-4 h-4 rounded-sm bg-cyan-500/70" />
          <div className="w-4 h-4 rounded-sm bg-cyan-500" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}