import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ShieldAlert, Calendar, Clock, UserCog, X } from 'lucide-react';

const MIN_CHARS = 20;
const MAX_CHARS = 500;

export default function AppealDialog({ open, onClose, moderation, robloxUsername, onSubmit }) {
  const [reason, setReason] = useState('');
  const [whyAccepted, setWhyAccepted] = useState('');
  const [deserved, setDeserved] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (open) {
      setReason('');
      setWhyAccepted('');
      setDeserved('');
      setSubmitting(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (reason.trim().length < MIN_CHARS || whyAccepted.trim().length < MIN_CHARS || deserved.trim().length < MIN_CHARS || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({
        appeal_reason: reason.trim(),
        why_accepted: whyAccepted.trim(),
        deserved_infraction: deserved.trim(),
      });
      setReason('');
      setWhyAccepted('');
      setDeserved('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const count1 = reason.trim().length;
  const count2 = whyAccepted.trim().length;
  const count3 = deserved.trim().length;
  const tooShort1 = count1 > 0 && count1 < MIN_CHARS;
  const tooShort2 = count2 > 0 && count2 < MIN_CHARS;
  const tooShort3 = count3 > 0 && count3 < MIN_CHARS;
  const canSubmit = count1 >= MIN_CHARS && count1 <= MAX_CHARS
    && count2 >= MIN_CHARS && count2 <= MAX_CHARS
    && count3 >= MIN_CHARS && count3 <= MAX_CHARS
    && !submitting;

  const meta = [
    moderation?.moderation_date && { icon: Calendar, label: new Date(moderation.moderation_date).toLocaleDateString() },
    moderation?.duration && { icon: Clock, label: moderation.duration },
    moderation?.staff_member && { icon: UserCog, label: moderation.staff_member },
  ].filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-slate-950 border-white/15 text-white sm:max-w-lg p-0 flex flex-col gap-0 max-h-[90vh] overflow-y-auto">
        <div className="p-6 pb-4 border-b border-white/10">
          <div className="flex items-start justify-between gap-4">
            <div className="h-12 w-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-6 w-6 text-rose-400" />
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-white/10 p-1.5 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <DialogTitle className="text-xl font-semibold mt-4">Appeal your moderation</DialogTitle>
          <DialogDescription className="text-slate-400 mt-1.5 leading-relaxed">
            Answer the questions below so staff can review your case. Be honest and respectful — your appeal goes straight to the staff team.
          </DialogDescription>
        </div>

        <div className="p-6 space-y-5">
          {/* Moderation context */}
          <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
            <div className="text-slate-500 text-[11px] uppercase tracking-wider font-medium">Moderation</div>
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              <span className="text-white font-semibold">{moderation?.moderation_type}</span>
              {moderation?.reason && <span className="text-slate-400">— {moderation.reason}</span>}
            </div>
            {meta.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {meta.map((m, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                    <m.icon className="h-3.5 w-3.5 text-slate-500" /> {m.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Q1: Appeal reason */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="appeal-reason" className="text-sm font-medium text-white">
                1. Explain what happened <span className="text-rose-400">*</span>
              </label>
              <span className={`text-xs font-mono ${tooShort1 ? 'text-amber-400' : count1 >= MIN_CHARS ? 'text-emerald-400' : 'text-slate-500'}`}>
                {count1}/{MAX_CHARS}
              </span>
            </div>
            <Textarea
              id="appeal-reason"
              ref={textareaRef}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSubmit(); }}
              placeholder="Tell us what happened, why the decision should be reconsidered, or any context the staff may have missed…"
              maxLength={MAX_CHARS}
              rows={5}
              className="bg-slate-900/60 border-white/15 text-white placeholder:text-slate-500 resize-none focus-visible:ring-cyan-500/40"
            />
            {tooShort1 && <p className="text-xs text-amber-400/90">Add a little more detail so the staff can review your appeal properly.</p>}
          </div>

          {/* Q2: Why should your appeal be accepted? */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="appeal-why" className="text-sm font-medium text-white">
                2. Why should your appeal be accepted? <span className="text-rose-400">*</span>
              </label>
              <span className={`text-xs font-mono ${tooShort2 ? 'text-amber-400' : count2 >= MIN_CHARS ? 'text-emerald-400' : 'text-slate-500'}`}>
                {count2}/{MAX_CHARS}
              </span>
            </div>
            <Textarea
              id="appeal-why"
              value={whyAccepted}
              onChange={(e) => setWhyAccepted(e.target.value)}
              placeholder="Explain why you believe this appeal deserves to be approved…"
              maxLength={MAX_CHARS}
              rows={4}
              className="bg-slate-900/60 border-white/15 text-white placeholder:text-slate-500 resize-none focus-visible:ring-cyan-500/40"
            />
            {tooShort2 && <p className="text-xs text-amber-400/90">Add a little more detail so the staff can review your appeal properly.</p>}
          </div>

          {/* Q3: Did you deserve this infraction? */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="appeal-deserved" className="text-sm font-medium text-white">
                3. Did you deserve this infraction in your opinion? <span className="text-rose-400">*</span>
              </label>
              <span className={`text-xs font-mono ${tooShort3 ? 'text-amber-400' : count3 >= MIN_CHARS ? 'text-emerald-400' : 'text-slate-500'}`}>
                {count3}/{MAX_CHARS}
              </span>
            </div>
            <Textarea
              id="appeal-deserved"
              value={deserved}
              onChange={(e) => setDeserved(e.target.value)}
              placeholder="Be honest — do you feel the moderation was justified? Why or why not?"
              maxLength={MAX_CHARS}
              rows={4}
              className="bg-slate-900/60 border-white/15 text-white placeholder:text-slate-500 resize-none focus-visible:ring-cyan-500/40"
            />
            {tooShort3 && <p className="text-xs text-amber-400/90">Add a little more detail so the staff can review your appeal properly.</p>}
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
            <p className="text-xs text-slate-500">Appealing as <span className="text-cyan-300 font-medium">{robloxUsername}</span></p>
            <div className="flex items-center gap-2 sm:justify-end">
              <Button variant="ghost" onClick={onClose} className="text-slate-300 hover:text-white hover:bg-white/10">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-0"
              >
                {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…</> : 'Submit appeal'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}