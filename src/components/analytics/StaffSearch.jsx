import { useState, useMemo } from 'react';
import { Search, Shield, Gavel, Activity, Calendar, Users, Ban, TrendingUp, ChevronRight, X } from 'lucide-react';

const ACTION_LABELS = {
  appeal_decision: 'Appeal decision',
  moderation_issued: 'Moderation issued',
  moderation_deleted: 'Moderation deleted',
  user_role_changed: 'Role changed',
};

function extractDecision(detail) {
  if (!detail) return null;
  const d = detail.toLowerCase();
  if (d.includes('approv')) return 'Approved';
  if (d.includes('deni') || d.includes('reject')) return 'Denied';
  return null;
}

function StatCard({ icon: Icon, label, value, color }) {
  const styles = {
    cyan: 'bg-cyan-500/15 border-cyan-500/20 text-cyan-400',
    violet: 'bg-violet-500/15 border-violet-500/20 text-violet-400',
    emerald: 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/15 border-amber-500/20 text-amber-400',
    rose: 'bg-rose-500/15 border-rose-500/20 text-rose-400',
    sky: 'bg-sky-500/15 border-sky-500/20 text-sky-400',
  };
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
      <div className={`h-9 w-9 rounded-xl border flex items-center justify-center mb-3 ${styles[color]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-400 mt-0.5">{label}</div>
    </div>
  );
}

export default function StaffSearch({ moderations, appeals, logs }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);

  const allStaff = useMemo(() => {
    const names = new Set();
    moderations.forEach((m) => { if (m.staff_member) names.add(m.staff_member); });
    logs.forEach((l) => { if (l.staff_username) names.add(l.staff_username); });
    return Array.from(names).sort();
  }, [moderations, logs]);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allStaff.filter((s) => s.toLowerCase().includes(q)).slice(0, 8);
  }, [query, allStaff]);

  const data = useMemo(() => {
    if (!selected) return null;
    const staffMods = moderations.filter((m) => m.staff_member === selected);
    const staffLogs = logs.filter((l) => l.staff_username === selected);
    const appealDecisions = staffLogs.filter((l) => l.action === 'appeal_decision');

    const modByType = {};
    staffMods.forEach((m) => { modByType[m.moderation_type] = (modByType[m.moderation_type] || 0) + 1; });

    const modByStatus = {};
    staffMods.forEach((m) => { modByStatus[m.status] = (modByStatus[m.status] || 0) + 1; });

    const playerCount = {};
    staffMods.forEach((m) => { playerCount[m.roblox_username] = (playerCount[m.roblox_username] || 0) + 1; });
    const topPlayers = Object.entries(playerCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const actionCount = {};
    staffLogs.forEach((l) => { actionCount[l.action] = (actionCount[l.action] || 0) + 1; });

    const decisions = { Approved: 0, Denied: 0 };
    appealDecisions.forEach((l) => {
      const d = extractDecision(l.detail);
      if (d) decisions[d]++;
    });

    const allDates = staffLogs.map((l) => l.created_date).filter(Boolean).sort();
    const firstAction = allDates[0];
    const lastAction = allDates[allDates.length - 1];
    const daysActive = firstAction && lastAction
      ? Math.max(1, Math.ceil((new Date(lastAction) - new Date(firstAction)) / 86400000))
      : 0;

    const recent = [...staffLogs].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 8);

    const bans = (modByType['Temporary Ban'] || 0) + (modByType['Permanent Ban'] || 0);
    const banRate = staffMods.length > 0 ? Math.round((bans / staffMods.length) * 100) : 0;

    // Most common reasons used by this staff member
    const reasonCount = {};
    staffMods.forEach((m) => {
      const r = (m.reason || '').trim() || '(no reason)';
      reasonCount[r] = (reasonCount[r] || 0) + 1;
    });
    const topReasons = Object.entries(reasonCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Appeal rate — how many of their moderations were appealed
    const modIds = new Set(staffMods.map((m) => m.id));
    const appealedMods = appeals.filter((a) => modIds.has(a.moderation_id));
    const appealRate = staffMods.length > 0 ? Math.round((appealedMods.length / staffMods.length) * 100) : 0;

    // Recent moderations issued
    const recentMods = [...staffMods]
      .sort((a, b) => new Date(b.moderation_date || b.created_date) - new Date(a.moderation_date || a.created_date))
      .slice(0, 6);

    // Day-of-week activity pattern
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayCount = [0, 0, 0, 0, 0, 0, 0];
    staffLogs.forEach((l) => {
      if (l.created_date) dayCount[new Date(l.created_date).getDay()]++;
    });
    const maxDay = Math.max(1, ...dayCount);

    // Average appeal response time (hours from appeal submission to decision)
    const responseTimes = [];
    appealDecisions.forEach((l) => {
      if (!l.target || !l.created_date) return;
      // Find the appeal referenced — match by target containing the player name
      const matchedAppeal = appeals.find((a) => l.detail && l.detail.includes(a.roblox_username));
      if (matchedAppeal && matchedAppeal.created_date) {
        const diffH = (new Date(l.created_date) - new Date(matchedAppeal.created_date)) / 3600000;
        if (diffH >= 0 && diffH < 720) responseTimes.push(diffH);
      }
    });
    const avgResponseHours = responseTimes.length > 0
      ? Math.round((responseTimes.reduce((s, v) => s + v, 0) / responseTimes.length) * 10) / 10
      : null;

    return { staffMods, staffLogs, appealDecisions, modByType, modByStatus, topPlayers, actionCount, decisions, firstAction, lastAction, daysActive, recent, bans, banRate, topReasons, appealRate, recentMods, dayNames, dayCount, maxDay, avgResponseHours };
  }, [selected, moderations, logs, appeals]);

  return (
    <div className="mt-8 rounded-2xl bg-white/[0.03] border border-white/10 p-6">
      <h2 className="text-lg font-semibold text-white mb-1">Staff member lookup</h2>
      <p className="text-sm text-slate-400 mb-4">Search any staff member to see their personal moderation and appeal stats.</p>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
          placeholder="Search staff name…"
          className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-950/50 border border-white/15 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-cyan-500/40"
        />
        {suggestions.length > 0 && !selected && (
          <div className="absolute z-10 mt-1.5 w-full rounded-xl bg-slate-900 border border-white/15 shadow-xl overflow-hidden">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => { setSelected(s); setQuery(s); }}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5 flex items-center gap-2"
              >
                <Shield className="h-3.5 w-3.5 text-cyan-400" /> {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && data && (
        <div className="mt-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center">
              <Shield className="h-6 w-6 text-cyan-300" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white">{selected}</h3>
              <p className="text-xs text-slate-500">
                {data.firstAction ? `Active since ${new Date(data.firstAction).toLocaleDateString()}` : 'No activity yet'}
                {data.daysActive > 0 && ` · ${data.daysActive} day${data.daysActive !== 1 ? 's' : ''} active`}
              </p>
            </div>
            <button onClick={() => { setSelected(null); setQuery(''); }} className="text-slate-500 hover:text-white p-1">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard icon={Shield} label="Moderations" value={data.staffMods.length} color="cyan" />
            <StatCard icon={Gavel} label="Appeal decisions" value={data.appealDecisions.length} color="violet" />
            <StatCard icon={Activity} label="Total actions" value={data.staffLogs.length} color="emerald" />
            <StatCard icon={Ban} label="Bans issued" value={data.bans} color="rose" />
            <StatCard icon={Users} label="Players moderated" value={data.topPlayers.length} color="sky" />
            <StatCard icon={TrendingUp} label="Ban rate" value={`${data.banRate}%`} color="amber" />
          </div>

          <div className="mt-6 grid sm:grid-cols-2 gap-6">
            {/* Moderations by type */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Moderations by type</h4>
              {data.staffMods.length === 0 ? (
                <p className="text-sm text-slate-500">No moderations issued.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(data.modByType).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                    const pct = (count / data.staffMods.length) * 100;
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-slate-300">{type}</span>
                          <span className="font-semibold text-white">{count}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Moderation status */}
              {data.staffMods.length > 0 && (
                <>
                  <h4 className="text-sm font-semibold text-white mb-3 mt-5">Moderation status</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(data.modByStatus).map(([status, count]) => (
                      <span key={status} className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                        {status}: <span className="font-semibold text-white">{count}</span>
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Top players + appeal decisions */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Top players moderated</h4>
              {data.topPlayers.length === 0 ? (
                <p className="text-sm text-slate-500">No players moderated.</p>
              ) : (
                <div className="space-y-2">
                  {data.topPlayers.map(([player, count], i) => (
                    <div key={player} className="flex items-center gap-2 text-sm">
                      <span className="text-xs font-bold text-slate-500 w-4">{i + 1}</span>
                      <span className="text-slate-300 truncate flex-1">{player}</span>
                      <span className="font-semibold text-white">{count}×</span>
                    </div>
                  ))}
                </div>
              )}

              {data.appealDecisions.length > 0 && (
                <>
                  <h4 className="text-sm font-semibold text-white mb-3 mt-5">Appeal decisions</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                      Approved: {data.decisions.Approved}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300">
                      Denied: {data.decisions.Denied}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                      Other: {data.appealDecisions.length - data.decisions.Approved - data.decisions.Denied}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action breakdown */}
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-white mb-3">Action breakdown</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(data.actionCount).map(([action, count]) => (
                <span key={action} className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                  {ACTION_LABELS[action] || action}: <span className="font-semibold text-white">{count}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Extra stats row */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/[0.02] border border-white/5 p-3">
              <div className="text-lg font-bold text-violet-300">{data.appealRate}%</div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wide">Appeal rate</div>
              <div className="text-[10px] text-slate-600 mt-0.5">of their moderations appealed</div>
            </div>
            <div className="rounded-xl bg-white/[0.02] border border-white/5 p-3">
              <div className="text-lg font-bold text-cyan-300">{data.avgResponseHours !== null ? `${data.avgResponseHours}h` : '—'}</div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wide">Avg response</div>
              <div className="text-[10px] text-slate-600 mt-0.5">appeal decision time</div>
            </div>
            <div className="rounded-xl bg-white/[0.02] border border-white/5 p-3">
              <div className="text-lg font-bold text-emerald-300">
                {data.staffMods.length > 0 ? Math.round((data.staffMods.length / Math.max(1, data.daysActive)) * 10) / 10 : 0}
              </div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wide">Mods / day</div>
              <div className="text-[10px] text-slate-600 mt-0.5">average daily output</div>
            </div>
          </div>

          {/* Common reasons + Day pattern */}
          <div className="mt-6 grid sm:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Most common reasons</h4>
              {data.topReasons.length === 0 ? (
                <p className="text-sm text-slate-500">No reasons recorded.</p>
              ) : (
                <div className="space-y-2">
                  {data.topReasons.map(([reason, count], i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-xs font-bold text-slate-500 w-4">{i + 1}</span>
                      <span className="text-slate-300 truncate flex-1">{reason}</span>
                      <span className="font-semibold text-white shrink-0">{count}×</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Activity by day</h4>
              <div className="space-y-1.5">
                {data.dayNames.map((day, i) => (
                  <div key={day} className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-7 shrink-0">{day}</span>
                    <div className="flex-1 h-4 rounded bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded bg-gradient-to-r from-cyan-500 to-blue-600"
                        style={{ width: `${(data.dayCount[i] / data.maxDay) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 w-6 text-right shrink-0">{data.dayCount[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent moderations issued */}
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Gavel className="h-4 w-4 text-cyan-400" /> Recent moderations issued
            </h4>
            {data.recentMods.length === 0 ? (
              <p className="text-sm text-slate-500">No moderations issued yet.</p>
            ) : (
              <div className="space-y-2">
                {data.recentMods.map((m) => (
                  <div key={m.id} className="flex items-start gap-3 rounded-lg bg-white/[0.02] border border-white/5 p-2.5">
                    <ChevronRight className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-cyan-300 font-medium">{m.roblox_username}</span>
                        <span className="text-xs text-slate-500">· {m.moderation_type}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                          m.status === 'Active' ? 'text-amber-300 bg-amber-500/10 border-amber-500/20' :
                          m.status === 'Repealed' ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' :
                          'text-slate-400 bg-slate-500/10 border-slate-500/20'
                        }`}>{m.status}</span>
                      </div>
                      <div className="text-sm text-slate-300 mt-0.5 truncate">{m.reason}</div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        {m.moderation_date ? new Date(m.moderation_date).toLocaleDateString() : '—'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent activity */}
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-cyan-400" /> Recent activity
            </h4>
            {data.recent.length === 0 ? (
              <p className="text-sm text-slate-500">No logged activity.</p>
            ) : (
              <div className="space-y-2">
                {data.recent.map((l) => (
                  <div key={l.id} className="flex items-start gap-3 rounded-lg bg-white/[0.02] border border-white/5 p-2.5">
                    <ChevronRight className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-200">{l.detail || ACTION_LABELS[l.action] || l.action}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {l.action && <span className="text-cyan-400/70">{ACTION_LABELS[l.action] || l.action}</span>}
                        {l.target && <span> · {l.target}</span>}
                        {l.created_date && <span> · {new Date(l.created_date).toLocaleString()}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}