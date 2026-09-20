const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from 'react';

import { useAuth } from '@/lib/AuthContext';
import { logStaffAction } from '@/lib/staffLog';
import { emailPlayer } from '@/lib/userEmails';
import { pushUnban } from '@/lib/renderBridge';
import { sendAppealDecisionWebhook } from '@/lib/discordWebhook';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import CustomDropdown from '@/components/ui/custom-dropdown';
import { Loader2, Gavel, ScrollText, Clock, CheckCircle2, XCircle, Calendar } from 'lucide-react';

const STATUSES = ['Pending', 'Under Review', 'Approved', 'Denied'];

const STATUS_STYLES = {
  Pending: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'Under Review': 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  Approved: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  Denied: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
};
const STATUS_ICON = { Pending: Clock, 'Under Review': Clock, Approved: CheckCircle2, Denied: XCircle };

export default function UserLookupAppeals({ appeals = [], moderations = [], username, onUpdated }) {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);

  const modMap = Object.fromEntries(moderations.map((m) => [m.id, m]));

  const draftFor = (a) =>
    drafts[a.id] || { status: a.status, staff_response: a.staff_response || '' };
  const setDraft = (id, patch) =>
    setDrafts((d) => ({ ...d, [id]: { ...draftFor({ id }), ...patch } }));

  const save = async (appeal) => {
    const draft = draftFor(appeal);
    const mod = modMap[appeal.moderation_id];
    setSavingId(appeal.id);
    try {
      await db.entities.Appeal.update(appeal.id, {
        status: draft.status,
        staff_response: draft.staff_response,
      });
      if (draft.status === 'Approved' && mod && mod.status !== 'Repealed') {
        await db.entities.Moderation.update(mod.id, { status: 'Repealed' });
        pushUnban(username);
      }
      db.entities.Notification.create({
        roblox_username: username,
        title: `Appeal ${draft.status.toLowerCase()}`,
        body: draft.staff_response || `Your appeal for ${mod?.moderation_type || 'your moderation'} has been ${draft.status.toLowerCase()}.`,
        type: 'appeal_decision',
        read: false,
      });
      logStaffAction(user, 'appeal_decision', username, `Set appeal to ${draft.status}${mod ? ` (${mod.moderation_type})` : ''}`);
      emailPlayer({
        robloxUsername: username,
        subject: `Your appeal has been ${draft.status.toLowerCase()}`,
        body: `Hi ${username},\n\nYour appeal for "${mod?.moderation_type || 'your moderation'}" has been ${draft.status.toLowerCase()}.\n\n${draft.staff_response ? draft.staff_response + '\n\n' : ''}View details in the Member Portal.\n\n\u2014 Escape Tsunami Staff Team`,
      });
      sendAppealDecisionWebhook({
        username,
        moderationType: mod?.moderation_type,
        decision: draft.status,
        staffName: user?.full_name || user?.email || 'Unknown staff',
        appealId: appeal.id,
      });
      onUpdated?.();
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
      <div className="flex items-center gap-2 mb-3">
        <ScrollText className="h-4 w-4 text-cyan-400" />
        <h4 className="text-sm font-semibold text-white">Appeals ({appeals.length})</h4>
      </div>
      {appeals.length === 0 ? (
        <div className="text-sm text-slate-500 py-8 text-center">No appeals submitted by this user.</div>
      ) : (
        <div className="space-y-3">
          {appeals.map((a) => {
            const mod = modMap[a.moderation_id];
            const draft = draftFor(a);
            const StatusIcon = STATUS_ICON[a.status] || Clock;
            return (
              <div key={a.id} className="rounded-xl bg-slate-950/40 border border-white/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="h-3.5 w-3.5" /> {new Date(a.created_date).toLocaleDateString()}
                    </div>
                    <div className="mt-1 text-sm">
                      Appeal for <span className="text-white font-medium">{mod?.moderation_type || 'Moderation'}</span>
                      {mod?.reason && <span className="text-slate-500"> \u2014 {mod.reason}</span>}
                    </div>
                    <p className="mt-1.5 text-sm text-slate-300">{a.appeal_reason}</p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[a.status] || ''}`}>
                    <StatusIcon className="h-3.5 w-3.5" /> {a.status}
                  </span>
                </div>

                <div className="mt-3 flex flex-col sm:flex-row gap-3">
                  <div className="w-full sm:w-44">
                    <label className="text-xs text-slate-400 mb-1 block">Decision</label>
                    <CustomDropdown
                      value={draft.status}
                      onChange={(v) => setDraft(a.id, { status: v })}
                      options={STATUSES.map((s) => ({ value: s, label: s }))}
                      placeholder="Select decision"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-slate-400 mb-1 block">Staff response</label>
                    <Textarea
                      rows={2}
                      value={draft.staff_response}
                      onChange={(e) => setDraft(a.id, { staff_response: e.target.value })}
                      className="bg-slate-950/60 border-white/15 text-white"
                      placeholder="Explain the decision\u2026"
                    />
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => save(a)}
                    disabled={savingId === a.id}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-0"
                  >
                    {savingId === a.id ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Saving</> : <><Gavel className="h-4 w-4 mr-1.5" /> Save</>}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}