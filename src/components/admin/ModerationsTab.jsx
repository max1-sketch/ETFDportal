const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/AuthContext';
import { logStaffAction } from '@/lib/staffLog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Search, Bot, Clock, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';
import RobloxAvatar from '@/components/moderations/RobloxAvatar';
import { pushUnban } from '@/lib/renderBridge';
import { useToast } from '@/components/ui/use-toast';
import CustomDropdown from '@/components/ui/custom-dropdown';
import QuickStats from '@/components/admin/moderations/QuickStats';
import ModerationForm from '@/components/admin/moderations/ModerationForm';
import ModerationTable from '@/components/admin/moderations/ModerationTable';
import DeleteConfirmDialog from '@/components/admin/moderations/DeleteConfirmDialog';

const DISCORD_STATUS_STYLES = {
  pending: { cls: 'bg-amber-500/10 text-amber-300 border-amber-500/20', icon: Clock, label: 'Pending' },
  completed: { cls: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20', icon: CheckCircle2, label: 'Done' },
  failed: { cls: 'bg-rose-500/10 text-rose-300 border-rose-500/20', icon: XCircle, label: 'Failed' },
};

const TYPE_OPTIONS = [
  { value: 'all', label: 'All types' },
  { value: 'Warning', label: 'Warning' },
  { value: 'Mute', label: 'Mute' },
  { value: 'Kick', label: 'Kick' },
  { value: 'Temporary Ban', label: 'Temporary Ban' },
  { value: 'Permanent Ban', label: 'Permanent Ban' },
];
const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'Active', label: 'Active' },
  { value: 'Expired', label: 'Expired' },
  { value: 'Repealed', label: 'Repealed' },
];
const DATE_OPTIONS = [
  { value: 'all', label: 'All time' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
];

export default function ModerationsTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [list, setList] = useState([]);
  const [discordList, setDiscordList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [mods, actions] = await Promise.all([
        db.entities.Moderation.list('-moderation_date', 100),
        db.entities.DiscordAction.list('-created_date', 50),
      ]);
      setList(mods || []);
      setDiscordList(actions || []);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const remove = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await db.entities.Moderation.delete(deleteTarget.id);
      if (deleteTarget.moderation_type === 'Permanent Ban' || deleteTarget.moderation_type === 'Temporary Ban') {
        try {
          await pushUnban(deleteTarget.roblox_username);
          toast({ title: 'Unban pushed to game server', description: `${deleteTarget.roblox_username} is now unbanned in-game.` });
        } catch (e) {
          toast({ variant: 'destructive', title: 'Failed to push unban to game', description: e.message });
        }
      }
      await logStaffAction(user, 'moderation_deleted', deleteTarget.roblox_username, `Deleted ${deleteTarget.moderation_type} — ${deleteTarget.reason}`);
      setDeleteTarget(null);
      await load();
    } finally {
      setDeleting(false);
    }
  };

  // Filtering
  const usernames = Array.from(new Set(list.map((m) => m.roblox_username).filter(Boolean)));
  const q = query.trim().toLowerCase();
  const matchedUser = q ? usernames.find((u) => u.toLowerCase() === q) : null;

  const now = Date.now();
  const dateCutoff = dateFilter === '24h' ? now - 24 * 60 * 60 * 1000
    : dateFilter === '7d' ? now - 7 * 24 * 60 * 60 * 1000
    : dateFilter === '30d' ? now - 30 * 24 * 60 * 60 * 1000
    : 0;

  const filtered = list.filter((m) => {
    if (q) {
      if (matchedUser ? m.roblox_username !== matchedUser : !(m.roblox_username || '').toLowerCase().includes(q)) return false;
    }
    if (typeFilter !== 'all' && m.moderation_type !== typeFilter) return false;
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    if (dateFilter !== 'all') {
      const d = m.moderation_date ? new Date(m.moderation_date).getTime() : 0;
      if (d < dateCutoff) return false;
    }
    return true;
  });

  const profile = matchedUser
    ? (() => {
        const um = list.filter((m) => m.roblox_username === matchedUser);
        const dates = um.map((m) => m.moderation_date).filter(Boolean).sort();
        return {
          username: matchedUser,
          total: um.length,
          bans: um.filter((m) => m.moderation_type.includes('Ban')).length,
          mutes: um.filter((m) => m.moderation_type === 'Mute').length,
          warnings: um.filter((m) => m.moderation_type === 'Warning').length,
          kicks: um.filter((m) => m.moderation_type === 'Kick').length,
          active: um.filter((m) => m.status === 'Active').length,
          since: dates[0] ? new Date(dates[0]).toLocaleDateString() : '—',
        };
      })()
    : null;

  const hasFilters = q || typeFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all';

  return (
    <div>
      <QuickStats list={list} />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-semibold text-white">All moderations</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
            {filtered.length}{hasFilters ? ` of ${list.length}` : ''}
          </span>
        </div>
        <Button
          size="sm"
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-0"
        >
          <Plus className="h-4 w-4 mr-1.5" /> New moderation
        </Button>
      </div>

      {/* Search + filters */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-3 space-y-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a Roblox username to see their history…"
            list="mod-usernames"
            className="bg-slate-950/60 border-white/15 text-white pl-9"
          />
          <datalist id="mod-usernames">
            {usernames.map((u) => <option key={u} value={u} />)}
          </datalist>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <CustomDropdown value={typeFilter} onChange={setTypeFilter} options={TYPE_OPTIONS} placeholder="Filter by type" />
          <CustomDropdown value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} placeholder="Filter by status" />
          <CustomDropdown value={dateFilter} onChange={setDateFilter} options={DATE_OPTIONS} placeholder="Filter by date" />
        </div>
      </div>

      {profile && (
        <div className="mb-4 rounded-2xl bg-white/[0.03] border border-white/10 p-5">
          <div className="flex items-center gap-3">
            <RobloxAvatar username={profile.username} size={48} />
            <div>
              <div className="text-white font-semibold">{profile.username}</div>
              <div className="text-xs text-slate-500">First moderation: {profile.since}</div>
            </div>
            <span className="ml-auto text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">{profile.active} active</span>
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { label: 'Total', value: profile.total, cls: 'text-white' },
              { label: 'Bans', value: profile.bans, cls: 'text-rose-300' },
              { label: 'Mutes', value: profile.mutes, cls: 'text-slate-300' },
              { label: 'Kicks', value: profile.kicks, cls: 'text-orange-300' },
              { label: 'Warnings', value: profile.warnings, cls: 'text-amber-300' },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-slate-950/40 border border-white/5 p-2.5 text-center">
                <div className={`text-lg font-bold ${s.cls}`}>{s.value}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16 text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 py-16 text-center text-slate-400">
          {hasFilters ? 'No moderations match your filters.' : 'No moderations issued yet.'}
        </div>
      ) : (
        <ModerationTable items={filtered} onDelete={setDeleteTarget} />
      )}

      {/* Discord actions section */}
      {discordList.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="h-4 w-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Discord actions</h3>
            <span className="text-xs text-slate-500">({discordList.length})</span>
          </div>
          <div className="space-y-2">
            {discordList.map((a) => {
              const st = DISCORD_STATUS_STYLES[a.status] || DISCORD_STATUS_STYLES.pending;
              const StatusIcon = st.icon;
              return (
                <div key={a.id} className="flex items-start justify-between gap-3 rounded-xl bg-white/[0.03] border border-white/10 px-4 py-3">
                  <div className="min-w-0">
                    <div className="text-sm">
                      <span className="text-indigo-300 font-medium">{a.discord_username || a.discord_user_id}</span>
                      <span className="text-slate-500"> · {a.action_type}{a.action_type === 'timeout' && a.duration_minutes ? ` (${a.duration_minutes}m)` : ''}</span>
                    </div>
                    <div className="text-xs text-slate-500 truncate mt-0.5">{a.reason}</div>
                    {a.status === 'failed' && a.result_message && (
                      <div className="mt-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 px-2.5 py-1.5 flex items-start gap-1.5">
                        <ShieldAlert className="h-3.5 w-3.5 text-rose-400 mt-0.5 shrink-0" />
                        <span className="text-xs text-rose-300">
                          {/missing permissions|higher role|forbidden|403/i.test(a.result_message)
                            ? `Bot lacks permission — this user's role is higher than the bot's. Reorder roles or grant the bot higher permissions. (${a.result_message})`
                            : a.result_message}
                        </span>
                      </div>
                    )}
                    {a.status === 'completed' && a.result_message && (
                      <div className="text-xs mt-1 text-emerald-400">{a.result_message}</div>
                    )}
                  </div>
                  <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${st.cls}`}>
                    <StatusIcon className="h-3 w-3" /> {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ModerationForm open={showForm} onClose={() => setShowForm(false)} onCreated={load} />
      <DeleteConfirmDialog
        moderation={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        onConfirm={remove}
        deleting={deleting}
      />
    </div>
  );
}