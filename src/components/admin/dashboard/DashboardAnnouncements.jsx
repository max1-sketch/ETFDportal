const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from 'react';

import { Megaphone, Pin, Trash2, Mail, Send, Loader2, Plus, Eye, EyeOff, Clock, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const TYPE_STYLES = {
  info: { label: 'Info', cls: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' },
  warning: { label: 'Warning', cls: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
  maintenance: { label: 'Maintenance', cls: 'bg-violet-500/10 text-violet-300 border-violet-500/20' },
  update: { label: 'Update', cls: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
  event: { label: 'Event', cls: 'bg-blue-500/10 text-blue-300 border-blue-500/20' },
};

const WEBHOOK_URL = 'https://discord.com/api/webhooks/1550634657320673400/ootH6wYSRKEGLVQnkuZgFRys2jEZr8KrAe2UOYFwAgJj7cAupR1UPJP8j_4j-Pvou5jv';

export default function DashboardAnnouncements({ user, onAnnouncementsChange }) {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', type: 'info', pinned: false, expires_at: '' });

  const load = async () => {
    setLoading(true);
    try {
      const list = await db.entities.Announcement.list('-created_date', 50);
      setAnnouncements(list || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast({ title: 'Title and body are required', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      await db.entities.Announcement.create({
        title: form.title.trim(),
        body: form.body.trim(),
        type: form.type,
        pinned: form.pinned,
        active: true,
        created_by: user?.email || 'Unknown',
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      });
      toast({ title: 'Announcement published', description: 'It is now visible to all visitors.' });
      setForm({ title: '', body: '', type: 'info', pinned: false, expires_at: '' });
      setShowForm(false);
      await load();
      onAnnouncementsChange?.();
    } catch {
      toast({ title: 'Failed to publish announcement', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const toggleActive = async (a) => {
    try {
      await db.entities.Announcement.update(a.id, { active: !a.active });
      await load();
      onAnnouncementsChange?.();
    } catch {
      toast({ title: 'Failed to update announcement', variant: 'destructive' });
    }
  };

  const togglePin = async (a) => {
    try {
      await db.entities.Announcement.update(a.id, { pinned: !a.pinned });
      await load();
    } catch {
      toast({ title: 'Failed to pin announcement', variant: 'destructive' });
    }
  };

  const remove = async (a) => {
    try {
      await db.entities.Announcement.delete(a.id);
      toast({ title: 'Announcement deleted' });
      await load();
      onAnnouncementsChange?.();
    } catch {
      toast({ title: 'Failed to delete announcement', variant: 'destructive' });
    }
  };

  const emailBlast = async (a) => {
    setSending(true);
    try {
      const users = await db.entities.User.list('-created_date', 500);
      const emails = (users || []).map((u) => u.email).filter(Boolean);
      let sent = 0;
      for (const email of emails) {
        try {
          await db.integrations.Core.SendEmail({
            to: email,
            subject: `[Announcement] ${a.title}`,
            body: `${a.body}\n\n— Escape Tsunami Portal`,
          });
          sent++;
        } catch { /* skip failed sends */ }
      }
      toast({ title: `Email sent to ${sent} user${sent !== 1 ? 's' : ''}` });
    } catch {
      toast({ title: 'Email blast failed', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const discordBlast = async (a) => {
    setSending(true);
    try {
      const colors = { info: 0x06b6d4, warning: 0xf59e0b, maintenance: 0x8b5cf6, update: 0x22c55e, event: 0x3b82f6 };
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '@everyone',
          embeds: [{
            title: `📢 ${a.title}`,
            description: a.body,
            color: colors[a.type] || 0x06b6d4,
            footer: { text: 'Escape Tsunami Portal' },
            timestamp: new Date().toISOString(),
          }],
        }),
      });
      toast({ title: 'Discord announcement sent' });
    } catch {
      toast({ title: 'Discord broadcast failed', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6">
      <div className="flex items-center gap-2 mb-5">
        <Megaphone className="h-5 w-5 text-cyan-400" />
        <h3 className="text-base font-semibold text-white">Announcements</h3>
        <span className="text-xs text-slate-500 ml-2">Broadcast to everyone on the site</span>
        <Button
          size="sm"
          onClick={() => setShowForm((s) => !s)}
          className="ml-auto bg-cyan-500 hover:bg-cyan-400 text-white border-0"
        >
          {showForm ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          {showForm ? 'Cancel' : 'New Announcement'}
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="mb-5 rounded-xl bg-slate-950/40 border border-white/10 p-4 space-y-3">
          <div>
            <Label className="text-sm text-slate-300 mb-1.5 block">Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="New game update released!"
              className="bg-slate-950/60 border-white/15 text-white"
            />
          </div>
          <div>
            <Label className="text-sm text-slate-300 mb-1.5 block">Body</Label>
            <Textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="We've just released a major update with new maps and features..."
              className="bg-slate-950/60 border-white/15 text-white min-h-[80px]"
            />
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-sm text-slate-300 mb-1.5 block">Type</Label>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(TYPE_STYLES).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => setForm({ ...form, type: key })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      form.type === key ? val.cls : 'bg-white/[0.02] border-white/10 text-slate-400'
                    }`}
                  >
                    {val.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm text-slate-300 mb-1.5 block flex items-center gap-1"><Clock className="h-3 w-3" /> Expires (optional)</Label>
              <Input
                type="datetime-local"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                className="bg-slate-950/60 border-white/15 text-white"
              />
            </div>
            <div>
              <Label className="text-sm text-slate-300 mb-1.5 block">Pin to top</Label>
              <button
                onClick={() => setForm({ ...form, pinned: !form.pinned })}
                className={`px-3 py-2 rounded-lg text-sm border transition-colors ${form.pinned ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300' : 'bg-white/[0.02] border-white/10 text-slate-400'}`}
              >
                {form.pinned ? '📌 Pinned' : 'Pin'}
              </button>
            </div>
          </div>
          <Button onClick={create} disabled={sending} className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-0">
            {sending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Send className="h-4 w-4 mr-1.5" />}
            Publish Announcement
          </Button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-8 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-10 text-slate-500">
          <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No announcements yet. Create one to broadcast it to everyone.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {announcements.map((a) => {
            const style = TYPE_STYLES[a.type] || TYPE_STYLES.info;
            const expired = a.expires_at && new Date(a.expires_at).getTime() < Date.now();
            return (
              <div key={a.id} className={`rounded-xl border p-4 transition-opacity ${a.active && !expired ? 'bg-white/[0.03] border-white/10' : 'bg-white/[0.01] border-white/5 opacity-50'}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {a.pinned && <Pin className="h-3.5 w-3.5 text-cyan-400" />}
                      <span className="text-sm font-semibold text-white">{a.title}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${style.cls}`}>{style.label}</span>
                      {expired && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-500 border border-slate-500/20">EXPIRED</span>}
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-2">{a.body}</p>
                    <div className="text-xs text-slate-600 mt-1.5 flex items-center gap-2">
                      {new Date(a.created_date).toLocaleDateString()}
                      {a.created_by && <span>· by {a.created_by}</span>}
                      {a.expires_at && <span>· expires {new Date(a.expires_at).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => togglePin(a)} title="Pin" className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-cyan-300">
                      <Pin className={`h-3.5 w-3.5 ${a.pinned ? 'text-cyan-400' : ''}`} />
                    </button>
                    <button onClick={() => toggleActive(a)} title={a.active ? 'Hide' : 'Show'} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white">
                      {a.active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => emailBlast(a)} title="Email all users" disabled={sending} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-emerald-300 disabled:opacity-40">
                      <Mail className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => discordBlast(a)} title="Send to Discord" disabled={sending} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-violet-300 disabled:opacity-40">
                      <Send className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => remove(a)} title="Delete" className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-rose-300">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}