import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollText, Calendar, Clock, UserCog, MessageSquare, CheckCircle2, XCircle } from 'lucide-react';

const STATUS_STYLES = {
  Pending: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'Under Review': 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  Approved: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  Denied: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
};
const STATUS_ICON = { Pending: Clock, 'Under Review': Clock, Approved: CheckCircle2, Denied: XCircle };

export default function AppealDetailsModal({ open, onClose, appeals = [], moderations = [] }) {
  const modMap = Object.fromEntries(moderations.map((m) => [m.id, m]));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-slate-950 border-white/15 text-white sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-lg flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-cyan-400" /> Your Appeals
            <span className="text-sm text-slate-500 font-normal">({appeals.length})</span>
          </DialogTitle>
        </DialogHeader>

        {appeals.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">No appeals submitted yet.</div>
        ) : (
          <div className="space-y-4">
            {appeals.map((a) => {
              const mod = modMap[a.moderation_id];
              const StatusIcon = STATUS_ICON[a.status] || Clock;
              return (
                <div key={a.id} className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
                  <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-2">The Incident</div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">{mod?.moderation_type || 'Moderation'}</span>
                    {mod?.reason && <span className="text-slate-400">\u2014 {mod.reason}</span>}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                    {mod?.moderation_date && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" /> {new Date(mod.moderation_date).toLocaleDateString()}
                      </span>
                    )}
                    {mod?.duration && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock className="h-3.5 w-3.5 text-slate-500" /> {mod.duration}
                      </span>
                    )}
                    {mod?.staff_member && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                        <UserCog className="h-3.5 w-3.5 text-slate-500" /> {mod.staff_member}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1">Your Appeal</div>
                  <p className="text-sm text-slate-300">{a.appeal_reason}</p>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">Status</div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[a.status] || ''}`}>
                      <StatusIcon className="h-3.5 w-3.5" /> {a.status}
                    </span>
                  </div>

                  {a.staff_response ? (
                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-slate-900/50 border border-white/10 p-3">
                      <MessageSquare className="h-4 w-4 text-cyan-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-medium text-slate-400 mb-0.5">Staff response</div>
                        <p className="text-sm text-slate-200">{a.staff_response}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-slate-500">No decision yet \u2014 your appeal is awaiting review.</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}