import { useMemo } from 'react';
import { Gavel, Shield, Trash2, UserCog } from 'lucide-react';

const ACTION_ICONS = {
  appeal_decision: Gavel,
  moderation_issued: Shield,
  moderation_deleted: Trash2,
  user_role_changed: UserCog,
};

const ACTION_LABELS = {
  appeal_decision: 'Appeal decisions',
  moderation_issued: 'Moderations issued',
  moderation_deleted: 'Moderations deleted',
  user_role_changed: 'Role changes',
};

export default function StaffActivity({ logs }) {
  const byStaff = useMemo(() => {
    const map = {};
    logs.forEach((l) => {
      const s = l.staff_username || 'Unknown';
      if (!map[s]) map[s] = { total: 0, actions: {} };
      map[s].total++;
      const a = l.action || 'unknown';
      map[s].actions[a] = (map[s].actions[a] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total).slice(0, 15);
  }, [logs]);

  const maxTotal = Math.max(1, ...byStaff.map((e) => e[1].total));

  return (
    <div className="mt-8 rounded-2xl bg-white/[0.03] border border-white/10 p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Staff activity leaderboard</h2>
      {byStaff.length === 0 ? (
        <p className="text-sm text-slate-500">No staff actions logged yet.</p>
      ) : (
        <div className="space-y-3">
          {byStaff.map(([staff, data], i) => (
            <div key={staff} className="rounded-xl bg-white/[0.02] border border-white/5 p-3">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-bold text-slate-500 w-5">{i + 1}</span>
                <span className="text-sm font-medium text-white flex-1 truncate">{staff}</span>
                <span className="text-sm font-bold text-cyan-300">{data.total}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-2">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600" style={{ width: `${(data.total / maxTotal) * 100}%` }} />
              </div>
              <div className="flex flex-wrap gap-2 ml-8">
                {Object.entries(data.actions).map(([action, count]) => {
                  const Icon = ACTION_ICONS[action] || Shield;
                  return (
                    <span key={action} className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">
                      <Icon className="h-3 w-3" /> {ACTION_LABELS[action] || action}: {count}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}