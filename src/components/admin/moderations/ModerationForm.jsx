const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from 'react';

import { useAuth } from '@/lib/AuthContext';
import { logStaffAction } from '@/lib/staffLog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Gavel, Copy, Bot, User as UserIcon, FileText, ShieldCheck, Clock, Zap } from 'lucide-react';
import CustomDropdown from '@/components/ui/custom-dropdown';
import { pushBan } from '@/lib/renderBridge';
import { useToast } from '@/components/ui/use-toast';
import { emailPlayer } from '@/lib/userEmails';

const TYPES = ['Warning', 'Mute', 'Kick', 'Temporary Ban', 'Permanent Ban'];
const STATUSES = ['Active', 'Expired', 'Repealed'];
const DISCORD_ACTIONS = [
  { value: 'timeout', label: 'Timeout (mute)' },
  { value: 'untimeout', label: 'Remove Timeout' },
  { value: 'kick', label: 'Kick' },
  { value: 'ban', label: 'Ban' },
  { value: 'unban', label: 'Unban' },
];
const DURATION_PRESETS = [
  { value: '', label: 'Permanent / N/A' },
  { value: '1h', label: '1 hour' },
  { value: '24h', label: '24 hours' },
  { value: '3d', label: '3 days' },
  { value: '7d', label: '7 days' },
  { value: '14d', label: '14 days' },
  { value: '30d', label: '30 days' },
  { value: 'custom', label: 'Custom…' },
];

const typeColor = (type) => {
  if (type === 'Permanent Ban') return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
  if (type === 'Temporary Ban') return 'bg-orange-500/15 text-orange-300 border-orange-500/30';
  if (type === 'Kick') return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  if (type === 'Mute') return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30';
  return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
};

const typeIcon = (type) => {
  if (type === 'Permanent Ban' || type === 'Temporary Ban') return <Gavel className="h-3 w-3" />;
  if (type === 'Kick') return <Zap className="h-3 w-3" />;
  if (type === 'Mute') return <Clock className="h-3 w-3" />;
  return <FileText className="h-3 w-3" />;
};

const empty = {
  platform: 'roblox',
  roblox_username: '',
  moderation_type: 'Warning',
  reason: '',
  details: '',
  duration: '',
  staff_member: '',
  status: 'Active',
  evidence_type: 'none',
  evidence_text: '',
  evidence_image_url: '',
  discord_user_id: '',
  discord_username: '',
  action_type: 'timeout',
  duration_minutes: 5,
};

const SectionHeader = ({ icon: Icon, label, color = 'cyan' }) => {
  const colorMap = {
    cyan: 'text-cyan-400/80',
    indigo: 'text-indigo-400/80',
  };
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.06] text-[11px] font-semibold uppercase tracking-wider ${colorMap[color] || colorMap.cyan}`}>
      <Icon className="h-3 w-3" /> {label}
    </div>
  );
};

export default function ModerationForm({ open, onClose, onCreated }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [durationMode, setDurationMode] = useState('');

  const reset = () => { setForm(empty); setDurationMode(''); };

  const handleClose = () => { reset(); onClose(); };

  const create = async () => {
    setSaving(true);
    try {
      if (form.platform === 'discord') {
        if (!form.discord_user_id || !form.reason) return;
        await db.entities.DiscordAction.create({
          discord_user_id: form.discord_user_id,
          discord_username: form.discord_username,
          action_type: form.action_type,
          reason: form.reason,
          duration_minutes: form.action_type === 'timeout' ? Number(form.duration_minutes) : undefined,
          status: 'pending',
          issued_by: user?.full_name || user?.email || 'Unknown staff',
        });
        await logStaffAction(user, 'moderation_issued', form.discord_username || form.discord_user_id, `Discord ${form.action_type} — ${form.reason}`);
        toast({ title: 'Discord action queued', description: 'Your bot will execute it within ~10 seconds.' });
      } else {
        if (!form.roblox_username || !form.reason) return;
        // Resolve exact Roblox username casing (case-insensitive match)
        let resolvedUsername = form.roblox_username;
        try {
          const userRes = await fetch(`https://users.roproxy.com/v1/usernames/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ usernames: [form.roblox_username], excludeBannedUsers: false }),
          });
          if (userRes.ok) {
            const match = (await userRes.json()).data?.[0];
            if (match) resolvedUsername = match.name;
          }
        } catch { /* use typed name as fallback */ }
        const modData = { ...form, roblox_username: resolvedUsername, moderation_date: new Date().toISOString() };
        await db.entities.Moderation.create(modData);
        db.entities.Notification.create({
          roblox_username: resolvedUsername,
          title: `New ${form.moderation_type} issued`,
          body: form.reason || 'A moderation action has been added to your account.',
          type: 'moderation_issued',
          read: false,
        });
        logStaffAction(user, 'moderation_issued', resolvedUsername, `Issued ${form.moderation_type} — ${form.reason}`);
        emailPlayer({
          robloxUsername: resolvedUsername,
          subject: `New ${form.moderation_type} on your account`,
          body: `Hi ${resolvedUsername},\n\nA ${form.moderation_type} has been issued on your account.\nReason: ${form.reason}\n${form.duration ? `Duration: ${form.duration}\n` : ''}\nView details in the Member Portal.\n\n— Escape Tsunami Staff Team`,
        });

        if (form.moderation_type === 'Permanent Ban' || form.moderation_type === 'Temporary Ban') {
          try {
            await pushBan(modData);
            toast({ title: 'Ban pushed to game server', description: `${resolvedUsername} is now banned in-game.` });
          } catch (e) {
            toast({ variant: 'destructive', title: 'Failed to push ban to game', description: e.message });
          }
        }
      }
      reset();
      onClose();
      onCreated?.();
    } finally {
      setSaving(false);
    }
  };

  const copyForDiscord = () => {
    const text = [
      `**${form.moderation_type}** — ${form.roblox_username || 'Unknown'}`,
      `Reason: ${form.reason || '—'}`,
      form.duration && `Duration: ${form.duration}`,
      form.staff_member && `Staff: ${form.staff_member}`,
      form.details && `Details: ${form.details}`,
    ].filter(Boolean).join('\n');
    navigator.clipboard?.writeText(text);
  };

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="bg-slate-900 border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-white text-lg flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30">
              <Gavel className="h-4 w-4 text-cyan-300" />
            </span>
            New moderation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Platform selector — segmented control */}
          <div className="flex gap-1 p-1 rounded-xl bg-slate-950/80 border border-white/10">
            <button
              type="button"
              onClick={() => set('platform')('roblox')}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                form.platform === 'roblox'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 text-cyan-300'
                  : 'border border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Roblox
            </button>
            <button
              type="button"
              onClick={() => set('platform')('discord')}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all inline-flex items-center justify-center gap-1.5 ${
                form.platform === 'discord'
                  ? 'bg-gradient-to-r from-indigo-500/20 to-purple-600/20 border border-indigo-500/40 text-indigo-300'
                  : 'border border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Bot className="h-3.5 w-3.5" /> Discord
            </button>
          </div>

          {form.platform === 'discord' ? (
            <>
              <div className="space-y-3">
                <SectionHeader icon={Bot} label="Discord Action" color="indigo" />
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-slate-400">Discord user ID *</Label>
                    <Input value={form.discord_user_id} onChange={(e) => set('discord_user_id')(e.target.value)} placeholder="e.g. 123456789012345678" className="bg-slate-950/60 border-white/10 text-white mt-1 font-mono text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-400">Discord username (optional)</Label>
                    <Input value={form.discord_username} onChange={(e) => set('discord_username')(e.target.value)} placeholder="e.g. username" className="bg-slate-950/60 border-white/10 text-white mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-400">Action type</Label>
                    <CustomDropdown
                      value={form.action_type}
                      onChange={set('action_type')}
                      options={DISCORD_ACTIONS}
                      className="mt-1"
                    />
                  </div>
                  {form.action_type === 'timeout' && (
                    <div>
                      <Label className="text-xs text-slate-400">Duration (minutes)</Label>
                      <Input type="number" min="1" value={form.duration_minutes} onChange={(e) => set('duration_minutes')(e.target.value)} className="bg-slate-950/60 border-white/10 text-white mt-1" />
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Reason *</Label>
                  <Textarea rows={2} value={form.reason} onChange={(e) => set('reason')(e.target.value)} className="bg-slate-950/60 border-white/10 text-white mt-1" />
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/15 p-3.5 text-xs text-slate-400">
                <Bot className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
                <span>Your Discord bot will pick this up and execute it within ~10 seconds.</span>
              </div>

              <div className="flex justify-end">
                <Button onClick={create} disabled={saving || !form.discord_user_id || !form.reason} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white border-0">
                  {saving ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Queuing</> : <><Bot className="h-4 w-4 mr-1.5" /> Queue Discord action</>}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Player & Action */}
              <div className="space-y-3">
                <SectionHeader icon={UserIcon} label="Player & Action" />
                <div>
                  <Label className="text-xs text-slate-400">Roblox username *</Label>
                  <Input value={form.roblox_username} onChange={(e) => set('roblox_username')(e.target.value)} className="bg-slate-950/60 border-white/10 text-white mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Type</Label>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {TYPES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => set('moderation_type')(t)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          form.moderation_type === t
                            ? typeColor(t)
                            : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                        }`}
                      >
                        {typeIcon(t)} {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-slate-400">Reason *</Label>
                    <Input value={form.reason} onChange={(e) => set('reason')(e.target.value)} className="bg-slate-950/60 border-white/10 text-white mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-400">Duration</Label>
                    <CustomDropdown
                      value={durationMode}
                      onChange={(v) => {
                        setDurationMode(v);
                        if (v !== 'custom') set('duration')(v);
                      }}
                      options={DURATION_PRESETS}
                      className="mt-1"
                    />
                  </div>
                  {durationMode === 'custom' && (
                    <div className="sm:col-span-2">
                      <Label className="text-xs text-slate-400">Custom duration</Label>
                      <Input value={form.duration} onChange={(e) => set('duration')(e.target.value)} placeholder="e.g. 12h, 5d" className="bg-slate-950/60 border-white/10 text-white mt-1" />
                    </div>
                  )}
                </div>
              </div>

              {/* Staff & Status */}
              <div className="space-y-3">
                <SectionHeader icon={ShieldCheck} label="Staff & Status" />
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-slate-400">Staff member</Label>
                    <Input value={form.staff_member} onChange={(e) => set('staff_member')(e.target.value)} className="bg-slate-950/60 border-white/10 text-white mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-400">Status</Label>
                    <CustomDropdown
                      value={form.status}
                      onChange={set('status')}
                      options={STATUSES.map((s) => ({ value: s, label: s }))}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Additional details</Label>
                  <Textarea rows={2} value={form.details} onChange={(e) => set('details')(e.target.value)} className="bg-slate-950/60 border-white/10 text-white mt-1" />
                </div>
              </div>

              {/* Evidence */}
              <div className="space-y-3">
                <SectionHeader icon={FileText} label="Evidence" />
                <div>
                  <Label className="text-xs text-slate-400">Evidence type</Label>
                  <CustomDropdown
                    value={form.evidence_type}
                    onChange={(v) => setForm((f) => ({ ...f, evidence_type: v, evidence_text: '', evidence_image_url: '' }))}
                    options={[
                      { value: 'none', label: 'None' },
                      { value: 'chat_log', label: 'Chat log' },
                      { value: 'screenshot', label: 'Screenshot' },
                    ]}
                    className="mt-1"
                  />
                </div>
                {form.evidence_type === 'chat_log' && (
                  <div>
                    <Label className="text-xs text-slate-400">Chat log</Label>
                    <Textarea rows={4} value={form.evidence_text} onChange={(e) => set('evidence_text')(e.target.value)} className="bg-slate-950/60 border-white/10 text-white mt-1 font-mono text-xs" placeholder="Paste the in-game chat log…" />
                  </div>
                )}
                {form.evidence_type === 'screenshot' && (
                  <div>
                    <Label className="text-xs text-slate-400">Screenshot URL</Label>
                    <Input value={form.evidence_image_url} onChange={(e) => set('evidence_image_url')(e.target.value)} placeholder="https://… image URL" className="bg-slate-950/60 border-white/10 text-white mt-1" />
                  </div>
                )}
              </div>

              {/* Preview */}
              <div className="rounded-xl bg-gradient-to-br from-slate-950/80 to-slate-900/40 border border-white/10 p-4 space-y-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Preview</div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center shrink-0">
                    <UserIcon className="h-4.5 w-4.5 text-cyan-300" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white truncate">{form.roblox_username || 'Unknown player'}</div>
                    <div className="text-xs text-slate-400">{form.duration ? `${form.moderation_type} · ${form.duration}` : form.moderation_type}</div>
                  </div>
                  <span className={`ml-auto text-xs px-2.5 py-1 rounded-full border whitespace-nowrap ${typeColor(form.moderation_type)}`}>{form.status}</span>
                </div>
                {form.reason && (
                  <div className="text-xs text-slate-400 pt-2.5 border-t border-white/5">
                    <span className="text-slate-500">Reason: </span>{form.reason}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" onClick={copyForDiscord} className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                  <Copy className="h-4 w-4 mr-1.5" /> Copy for Discord
                </Button>
                <Button onClick={create} disabled={saving || !form.roblox_username || !form.reason} className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-0">
                  {saving ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Issuing</> : <><Gavel className="h-4 w-4 mr-1.5" /> Issue moderation</>}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}