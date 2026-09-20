import { useMemo } from 'react';
import { Users, RotateCcw } from 'lucide-react';

const TYPE_WEIGHT = {
  Warning: 1,
  Mute: 2,
  Kick: 3,
  'Temporary Ban': 4,
  'Permanent Ban': 5,
};

export default function RepeatOffenders({ moderations }) {
  const offenders = useMemo(() => {
    const map = {};
    moderations.forEach((m) => {
      const u = m.roblox_username || 'Unknown';
      if (!map[u]) map[u] = { count: 0, types: {}, maxSeverity: 0, lastDate: null };
      map[u].count++;
      map[u].types[m.moderation_type] = (map[u].types[m.moderation_type] || 0) + 1;
      map[u].maxSeverity = Math.max(map[u].maxSeverity, TYPE_WEIGHT[m.moderation_type] || 0);
      const d = m.moderation_date || m.created_date;
      if (d && (!map[u].lastDate || new Date(d) > new Date(map[u].lastDate))) map[u].lastDate = d;
    });
    return Object.entries(map)
      .filter(([, v]) => v.count >= 2)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10);
  }, [moderations]);

  const repeatCount = offenders.length;
  const totalPlayers = useMemo(() => new Set(moderations.map((m) => m.roblox_username)).size, [moderations]);
  const repeatRate = totalPlayers > 0 ? Math.round((repeatCount / totalPlayers) * 100) : 0;

  const severityLabel = (w) => {
    const labels = { 1: 'Warning', 2: 'Mute', 3: 'Kick', 4: 'Temp Ban', 5: 'Perm Ban' };
    return labels[w] || '—';
  };

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6">
      <div className="flex items-center gap-2 mb-1">
        <RotateCcw className="h-5 w-5 text-rose-400" />
        <h2 className="text-lg font-semibold text-white">Repeat offenders</h2>
      </div>
      <p className="text-sm text-slate-400 mb-4">
        {repeatCount} players with 2+ moderations · {repeatRate}% of all moderated players
      </p>
      {offenders.length === 0 ? (
        <p className="text-sm text-slate-500">No repeat offenders yet.</p>
      ) : (
        <div className="space-y-2.5">
          {offenders.map(([username, data], i) => (
            <div key={username} className="flex items-center gap-3 rounded-xl bg-white/[0.02] border border-white/5 px-3 py-2.5">
              <span className="text-xs font-bold text-slate-500 w-5 shrink-0">{i + 1}</span>
              <Users className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-slate-200 truncate">{username}</span>
                  <span className="text-sm font-bold text-rose-300 shrink-0">{data.count}×</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                  <span>Worst: {severityLabel(data.maxSeverity)}</span>
                  {data.lastDate && <span>· Last: {new Date(data.lastDate).toLocaleDateString()}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}