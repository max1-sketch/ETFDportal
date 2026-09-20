const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

import { useAuth } from '@/lib/AuthContext';
import { logStaffAction } from '@/lib/staffLog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Gavel, Lock, X, MessageSquare, Zap, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { pushUnban, fetchChatLogs, fetchExploitLogs } from '@/lib/renderBridge';
import { emailPlayer } from '@/lib/userEmails';
import { sendAppealDecisionWebhook } from '@/lib/discordWebhook';
import CustomDropdown from '@/components/ui/custom-dropdown';
import AppealAISummary from '@/components/admin/AppealAISummary';
import { RESPONSE_TEMPLATES, fillTemplate, buildTemplateVars } from '@/lib/responseTemplates';

const STATUSES = ['Pending', 'Under Review', 'Approved', 'Denied'];

const STATUS_STYLES = {
  'Pending': { cls: 'bg-amber-500/10 text-amber-300 border-amber-500/20', icon: Clock },
  'Under Review': { cls: 'bg-violet-500/10 text-violet-300 border-violet-500/20', icon: Loader2 },
  'Approved': { cls: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20', icon: CheckCircle2 },
  'Denied': { cls: 'bg-rose-500/10 text-rose-300 border-rose-500/20', icon: XCircle },
};

const EXPLOIT_STYLES = {
  'Teleport': 'bg-rose-500/10 text-rose-300 border-rose-500/20',
  'Fly': 'bg-orange-500/10 text-orange-300 border-orange-500/20',
  'Noclip': 'bg-purple-500/10 text-purple-300 border-purple-500/20',
};

export default function AppealReviewModal({ open, onClose, appeal, moderation, onSaved }) {
  const { user } = useAuth();
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [chatLogs, setChatLogs] = useState([]);
  const [exploitLogs, setExploitLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState('');

  useEffect(() => {
    if (appeal) {
      setDraft({
        status: appeal.status,
        staff_response: appeal.staff_response || '',
        internal_notes: appeal.internal_notes || '',
        can_reappeal: appeal.can_reappeal !== false,
      });
    }
  }, [appeal]);

  useEffect(() => {
    if (!open || !appeal?.roblox_username) return;
    setLogsLoading(true);
    setLogsError('');
    Promise.all([
      fetchChatLogs(appeal.roblox_username).catch(() => []),
      fetchExploitLogs(appeal.roblox_username).catch(() => []),
    ])
      .then(([chats, exploits]) => {
        setChatLogs(chats);
        setExploitLogs(exploits);
      })
      .catch(() => setLogsError('Failed to load logs'))
      .finally(() => setLogsLoading(false));
  }, [open, appeal]);

  if (!appeal || !draft) return null;

  const st = STATUS_STYLES[appeal.status] || STATUS_STYLES['Pending'];
  const StatusIcon = st.icon;

  const save = async () => {
    setSaving(true);
    try {
      await db.entities.Appeal.update(appeal.id, {
        status: draft.status,
        staff_response: draft.staff_response,
        internal_notes: draft.internal_notes,
        can_reappeal: draft.can_reappeal,
      });
      if (draft.status === 'Approved' && moderation && moderation.status !== 'Repealed') {
        await db.entities.Moderation.update(moderation.id, { status: 'Repealed' });
        await pushUnban(appeal.roblox_username);
      }
      await db.entities.Notification.create({
        roblox_username: appeal.roblox_username,
        title: `Appeal ${draft.status.toLowerCase()}`,
        body: draft.staff_response || `Your appeal for ${moderation?.moderation_type || 'your moderation'} has been ${draft.status.toLowerCase()}.`,
        type: 'appeal_decision',
        read: false,
      });
      await logStaffAction(user, 'appeal_decision', appeal.roblox_username, `Set appeal to ${draft.status}${moderation ? ` (${moderation.moderation_type})` : ''}`);
      await emailPlayer({
        robloxUsername: appeal.roblox_username,
        subject: `Your appeal has been ${draft.status.toLowerCase()}`,
        body: `Hi ${appeal.roblox_username},\n\nYour appeal for "${moderation?.moderation_type || 'your moderation'}" has been ${draft.status.toLowerCase()}.\n\n${draft.staff_response ? draft.staff_response + '\n\n' : ''}View details in the Member Portal.\n\n— Escape Tsunami Staff Team`,
      });
      await sendAppealDecisionWebhook({
        username: appeal.roblox_username,
        moderationType: moderation?.moderation_type,
        decision: draft.status,
        staffName: user?.full_name || user?.email || 'Unknown staff',
        appealId: appeal.id,
      });
      onSaved?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-slate-950 border-white/15 text-white sm:max-w-2xl p-0 flex flex-col gap-0 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-white/10 sticky top-0 bg-slate-950 z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-cyan-300 font-medium">{appeal.roblox_username}</span>
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${st.cls}`}>
                  <StatusIcon className="h-3 w-3" /> {appeal.status}
                </span>
              </div>
              <DialogTitle className="text-lg font-semibold mt-1">
                {moderation?.moderation_type || 'Moderation'} Appeal
              </DialogTitle>
              <DialogDescription className="text-slate-400 mt-0.5">
                Submitted {new Date(appeal.created_date).toLocaleString()}
              </DialogDescription>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-white/10 p-1.5 transition-colors shrink-0">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Moderation context */}
          {moderation && (
            <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
              <div className="text-slate-500 text-[11px] uppercase tracking-wider font-medium">Moderation details</div>
              <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                <span className="text-white font-semibold">{moderation.moderation_type}</span>
                {moderation.reason && <span className="text-slate-400">— {moderation.reason}</span>}
              </div>
              {moderation.details && <p className="mt-2 text-sm text-slate-400">{moderation.details}</p>}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {moderation.staff_member && <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">👤 {moderation.staff_member}</span>}
                {moderation.duration && <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">⏱ {moderation.duration}</span>}
                {moderation.moderation_date && <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">📅 {new Date(moderation.moderation_date).toLocaleDateString()}</span>}
              </div>
            </div>
          )}

          {/* Appeal answers */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-cyan-400" /> Player's appeal
            </h3>
            {appeal.appeal_reason && (
              <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
                <div className="text-[11px] text-slate-500 uppercase tracking-wide font-medium mb-1">1. What happened?</div>
                <p className="text-sm text-slate-200">{appeal.appeal_reason}</p>
              </div>
            )}
            {appeal.why_accepted && (
              <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
                <div className="text-[11px] text-slate-500 uppercase tracking-wide font-medium mb-1">2. Why should your appeal be accepted?</div>
                <p className="text-sm text-slate-200">{appeal.why_accepted}</p>
              </div>
            )}
            {appeal.deserved_infraction && (
              <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
                <div className="text-[11px] text-slate-500 uppercase tracking-wide font-medium mb-1">3. Did you deserve this infraction in your opinion?</div>
                <p className="text-sm text-slate-200">{appeal.deserved_infraction}</p>
              </div>
            )}
          </div>

          {/* Chat logs */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-slate-400" /> Chat logs
              <span className="text-xs text-slate-500 font-normal">({chatLogs.length})</span>
            </h3>
            {logsLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-400 py-3"><Loader2 className="h-4 w-4 animate-spin" /> Loading chat logs…</div>
            ) : logsError ? (
              <div className="text-sm text-rose-400 py-2">{logsError}</div>
            ) : chatLogs.length === 0 ? (
              <div className="text-sm text-slate-500 py-2">No chat logs on file for this player.</div>
            ) : (
              <div className="rounded-xl bg-slate-900/60 border border-white/10 max-h-48 overflow-y-auto divide-y divide-white/5">
                {chatLogs.slice(-50).reverse().map((log, i) => (
                  <div key={i} className="px-3 py-2 text-sm">
                    <span className="text-slate-500 text-xs mr-2">{log.time || new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span className="text-slate-200">{log.msg}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Context Summarizer */}
          {!logsLoading && (chatLogs.length > 0 || exploitLogs.length > 0) && (
            <AppealAISummary
              chatLogs={chatLogs}
              exploitLogs={exploitLogs}
              moderation={moderation}
              appeal={appeal}
            />
          )}

          {/* Exploit logs */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-400" /> Exploit logs
              <span className="text-xs text-slate-500 font-normal">({exploitLogs.length})</span>
            </h3>
            {logsLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-400 py-3"><Loader2 className="h-4 w-4 animate-spin" /> Loading exploit logs…</div>
            ) : exploitLogs.length === 0 ? (
              <div className="text-sm text-slate-500 py-2">No exploit detections on file for this player.</div>
            ) : (
              <div className="rounded-xl bg-slate-900/60 border border-white/10 max-h-48 overflow-y-auto divide-y divide-white/5">
                {exploitLogs.slice(-30).reverse().map((log, i) => (
                  <div key={i} className="px-3 py-2 text-sm flex items-start gap-2">
                    <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border ${EXPLOIT_STYLES[log.exploitType] || 'bg-white/5 text-slate-300 border-white/10'}`}>
                      {log.exploitType}
                    </span>
                    <div className="min-w-0">
                      <div className="text-slate-200 text-xs">{log.details}</div>
                      <div className="text-slate-500 text-[10px]">{new Date(log.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Decision controls */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Gavel className="h-4 w-4 text-cyan-400" /> Staff decision
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="w-full sm:w-48">
                <label className="text-xs text-slate-400 mb-1 block">Decision</label>
                <CustomDropdown
                  value={draft.status}
                  onChange={(v) => setDraft({ ...draft, status: v })}
                  options={STATUSES.map((s) => ({ value: s, label: s }))}
                  placeholder="Select decision"
                />
                {draft.status === 'Denied' && (
                  <label className="mt-2 flex items-start gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.can_reappeal}
                      onChange={(e) => setDraft({ ...draft, can_reappeal: e.target.checked })}
                      className="mt-0.5 h-4 w-4 rounded border-white/20 bg-slate-950 accent-cyan-500"
                    />
                    <span>Allow this player to submit a new appeal</span>
                  </label>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-slate-400">Staff response (shown to player)</label>
                  <CustomDropdown
                    value=""
                    onChange={(v) => {
                      const t = RESPONSE_TEMPLATES.find((x) => x.label === v);
                      if (t) {
                        const vars = buildTemplateVars({ appeal, moderation, user });
                        setDraft({ ...draft, staff_response: fillTemplate(t.text, vars) });
                      }
                    }}
                    options={RESPONSE_TEMPLATES.map((t) => ({ value: t.label, label: t.label }))}
                    placeholder="Templates…"
                    buttonClassName="h-7 text-xs"
                  />
                </div>
                <Textarea
                  rows={2}
                  value={draft.staff_response}
                  onChange={(e) => setDraft({ ...draft, staff_response: e.target.value })}
                  className="bg-slate-950/60 border-white/15 text-white"
                  placeholder="Explain the decision…"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-slate-500" /> Internal notes (staff only — never shown to player)
              </label>
              <Textarea
                rows={2}
                value={draft.internal_notes}
                onChange={(e) => setDraft({ ...draft, internal_notes: e.target.value })}
                className="bg-slate-950/60 border-white/10 text-slate-300 placeholder:text-slate-600"
                placeholder="Private context for the mod team…"
              />
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <Button variant="ghost" onClick={onClose} className="text-slate-300 hover:text-white hover:bg-white/10">
              Cancel
            </Button>
            <Button
              onClick={save}
              disabled={saving}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-0"
            >
              {saving ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Saving</> : <><Gavel className="h-4 w-4 mr-1.5" /> Save decision</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}