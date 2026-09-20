import { useMemo } from 'react';
import { Ban, AlertTriangle, VolumeX, UserX, Clock } from 'lucide-react';

const TYPE_ICONS = {
  Warning: AlertTriangle,
  Mute: VolumeX,
  Kick: UserX,
  'Temporary Ban': Clock,
  'Permanent Ban': Ban,
};

export default function ModerationAnalytics({ moderations }) {
  const byType = useMemo(() => {
    const map = {};
    moderations.forEach((m) => {
      const t = m.moderation_type || 'Unknown';
      map[t] = (map[t] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [moderations]);

  const byStaff = useMemo(() => {
    const map = {};
    moderations.forEach((m) => {
      const s = m.staff_member || 'Unknown';
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [moderations]);

  const byPlayer = useMemo(() => {
    const map = {};
    moderations.forEach((m) => {
      const p = m.roblox_username || 'Unknown';
      map[p] = (map[p] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [moderations]);

  const maxStaff = Math.max(1, ...byStaff.map((e) => e[1]));
  const maxPlayer = Math.max(1, ...byPlayer.map((e) => e[1]));

  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Moderations by type</h2>
        {byType.length === 0 ? (
          <p className="text-sm text-slate-500">No moderations yet.</p>
        ) : (
          <div className="space-y-3">
            {byType.map(([type, count]) => {
              const Icon = TYPE_ICONS[type] || AlertTriangle;
              const pct = (count / Math.max(1, moderations.length)) * 100;
              return (
                <div key={type} className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-300">{type}</span>
                      <span className="text-sm font-semibold text-white">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Top staff (moderations issued)</h2>
          {byStaff.length === 0 ? (
            <p className="text-sm text-slate-500">No data yet.</p>
          ) : (
            <div className="space-y-2.5">
              {byStaff.map(([staff, count], i) => (
                <div key={staff} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-500 w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-300 truncate">{staff}</span>
                      <span className="text-sm font-semibold text-white ml-2">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full bg-cyan-400" style={{ width: `${(count / maxStaff) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Most moderated players</h2>
          {byPlayer.length === 0 ? (
            <p className="text-sm text-slate-500">No data yet.</p>
          ) : (
            <div className="space-y-2.5">
              {byPlayer.map(([player, count], i) => (
                <div key={player} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-500 w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-300 truncate">{player}</span>
                      <span className="text-sm font-semibold text-white ml-2">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full bg-rose-400" style={{ width: `${(count / maxPlayer) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}