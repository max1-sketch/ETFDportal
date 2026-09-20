import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';

const SEVERITY = {
  Warning: 1,
  Mute: 2,
  Kick: 3,
  'Temporary Ban': 4,
  'Permanent Ban': 5,
};

const COLOR_MAP = {
  emerald: {
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    icon: 'text-emerald-400',
    container: 'bg-emerald-500/10 border-emerald-500/20',
  },
  amber: {
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    icon: 'text-amber-400',
    container: 'bg-amber-500/10 border-amber-500/20',
  },
  rose: {
    badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    icon: 'text-rose-400',
    container: 'bg-rose-500/10 border-rose-500/20',
  },
};

export default function AccountStanding({ moderations = [] }) {
  const active = moderations.filter((m) => m.status === 'Active');
  const score = active.reduce((s, m) => s + (SEVERITY[m.moderation_type] || 1), 0);
  const hasPerm = active.some((m) => m.moderation_type === 'Permanent Ban');

  let level, color, Icon, pct, description;
  if (score === 0) {
    level = 'Good Standing';
    color = 'emerald';
    Icon = ShieldCheck;
    pct = 100;
    description = 'Your account is in great shape — keep it up!';
  } else if (hasPerm || score >= 4) {
    level = 'At Risk';
    color = 'rose';
    Icon = ShieldAlert;
    pct = 15;
    description = 'Active bans on your account — review below.';
  } else {
    level = 'Warning';
    color = 'amber';
    Icon = AlertTriangle;
    pct = 60;
    description = 'Some active moderations — be mindful of the rules.';
  }

  const c = COLOR_MAP[color];
  const markerLeft = 100 - pct;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border ${c.container}`}>
            <Icon className={`h-5 w-5 ${c.icon}`} />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Account Standing</div>
            <div className="text-xs text-slate-500 mt-0.5">{description}</div>
          </div>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${c.badge} shrink-0`}>{level}</span>
      </div>

      <div className="mt-4 relative h-2.5 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500">
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-white border-2 border-slate-950 shadow-lg transition-all duration-500"
          style={{ left: `${markerLeft}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wide text-slate-500">
        <span>Good</span>
        <span>Warning</span>
        <span>At Risk</span>
      </div>
    </div>
  );
}