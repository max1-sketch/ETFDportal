const STATUS_STYLES = {
  Active: { cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400' },
  Expired: { cls: 'bg-rose-500/15 text-rose-300 border-rose-500/30', dot: 'bg-rose-400' },
  Repealed: { cls: 'bg-slate-500/15 text-slate-300 border-slate-500/30', dot: 'bg-slate-400' },
};

const TYPE_STYLES = {
  Warning: { cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  Mute: { cls: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
  Kick: { cls: 'bg-orange-500/15 text-orange-300 border-orange-500/30' },
  'Temporary Ban': { cls: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  'Permanent Ban': { cls: 'bg-red-600/20 text-red-300 border-red-500/40' },
};

export function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.Active;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${s.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

export function TypeBadge({ type }) {
  const s = TYPE_STYLES[type] || { cls: 'bg-slate-500/15 text-slate-300 border-slate-500/30' };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${s.cls}`}>
      {type}
    </span>
  );
}