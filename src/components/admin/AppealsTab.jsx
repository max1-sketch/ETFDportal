const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from 'react';

import { Loader2, CheckCircle2, ChevronRight } from 'lucide-react';
import AppealReviewModal from '@/components/admin/AppealReviewModal';

const STATUS_STYLES = {
  'Pending': 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  'Under Review': 'bg-violet-500/10 text-violet-300 border-violet-500/20',
  'Approved': 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  'Denied': 'bg-rose-500/10 text-rose-300 border-rose-500/20',
};

const priorityFor = (mod) => {
  const t = mod?.moderation_type;
  if (t === 'Permanent Ban' || t === 'Temporary Ban') return { label: 'High', cls: 'bg-rose-500/15 text-rose-300 border-rose-500/30' };
  if (t === 'Warning') return { label: 'Low', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
  return { label: 'Medium', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
};

export default function AppealsTab() {
  const [appeals, setAppeals] = useState([]);
  const [moderations, setModerations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [apps, mods] = await Promise.all([
        db.entities.Appeal.list('-created_date', 100),
        db.entities.Moderation.list('-moderation_date', 100),
      ]);
      setAppeals(apps || []);
      setModerations(mods || []);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const modFor = (id) => moderations.find((m) => m.id === id);

  const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 };
  const sortedAppeals = [...appeals].sort((a, b) => {
    const pa = PRIORITY_RANK[priorityFor(modFor(a.moderation_id)).label] ?? 1;
    const pb = PRIORITY_RANK[priorityFor(modFor(b.moderation_id)).label] ?? 1;
    if (pa !== pb) return pa - pb;
    return new Date(b.created_date) - new Date(a.created_date);
  });

  const pendingCount = appeals.filter((a) => a.status === 'Pending').length;

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-slate-400"><Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading appeals…</div>;
  }
  if (!appeals.length) {
    return (
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 py-16 text-center">
        <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="h-7 w-7 text-emerald-400" />
        </div>
        <div className="text-sm font-medium text-white">All caught up!</div>
        <div className="text-xs text-slate-500 mt-1">No appeals waiting for review right now.</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5 mb-3">
        <h2 className="text-lg font-semibold text-white">Appeals queue</h2>
        <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">{appeals.length}</span>
        {pendingCount > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300">{pendingCount} new</span>}
        <span className="text-xs text-slate-500 ml-auto">Sorted by priority · Click to review</span>
      </div>
      {sortedAppeals.map((a) => {
        const mod = modFor(a.moderation_id);
        const priority = priorityFor(mod);
        const st = STATUS_STYLES[a.status] || STATUS_STYLES['Pending'];
        return (
          <button
            key={a.id}
            onClick={() => setSelected(a)}
            className="w-full text-left rounded-2xl bg-white/[0.03] border border-white/10 p-4 hover:bg-white/[0.06] hover:border-cyan-500/30 transition-all group"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-cyan-300 font-medium">{a.roblox_username}</span>
                  <span className="text-slate-500 text-sm">· {mod?.moderation_type || 'Moderation'}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-500">{new Date(a.created_date).toLocaleString()}</span>
                  <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${priority.cls}`}>{priority.label}</span>
                </div>
                <p className="mt-2 text-sm text-slate-400 line-clamp-2">{a.appeal_reason}</p>
                {mod?.reason && <p className="mt-1 text-xs text-slate-500 truncate">Moderation reason: {mod.reason}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs px-2.5 py-1 rounded-full border ${st}`}>{a.status}</span>
                <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-300 transition-colors transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </button>
        );
      })}
      <AppealReviewModal
        open={!!selected}
        onClose={() => setSelected(null)}
        appeal={selected}
        moderation={selected ? modFor(selected.moderation_id) : null}
        onSaved={load}
      />
    </div>
  );
}