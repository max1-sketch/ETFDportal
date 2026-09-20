import { motion } from 'framer-motion';
import { ScrollText, CheckCircle2, XCircle, Clock, MessageSquare, Calendar } from 'lucide-react';

const STATUS_STYLES = {
  Pending: { badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30', accent: 'border-l-amber-500/50' },
  'Under Review': { badge: 'bg-violet-500/15 text-violet-300 border-violet-500/30', accent: 'border-l-violet-500/50' },
  Approved: { badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', accent: 'border-l-emerald-500/50' },
  Denied: { badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30', accent: 'border-l-rose-500/50' },
};
const STATUS_ICON = { Pending: Clock, 'Under Review': Clock, Approved: CheckCircle2, Denied: XCircle };

function AppealTimeline({ status }) {
  const steps = [
    { key: 'submitted', label: 'Submitted', reached: true },
    { key: 'review', label: 'Under Review', reached: ['Under Review', 'Approved', 'Denied'].includes(status) },
    { key: 'resolved', label: 'Resolved', reached: ['Approved', 'Denied'].includes(status) },
  ];

  return (
    <div className="mt-4 flex items-center gap-1">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                  step.reached
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                    : 'bg-white/[0.03] border-white/15 text-slate-600'
                }`}
              >
                {step.reached ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Clock className="h-3 w-3" />
                )}
              </div>
              <span className={`text-[10px] font-medium ${step.reached ? 'text-cyan-300' : 'text-slate-600'}`}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`h-0.5 flex-1 mx-1 rounded-full transition-colors ${
                  steps[i + 1].reached ? 'bg-cyan-400/50' : 'bg-white/10'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AppealHistory({ appeals = [], moderations = [] }) {
  if (!appeals.length) return null;
  const modMap = Object.fromEntries(moderations.map((m) => [m.id, m]));

  return (
    <section className="mt-10">
      <div className="flex items-center gap-2.5 mb-4">
        <ScrollText className="h-5 w-5 text-cyan-400" />
        <h2 className="font-display text-xl font-semibold">Appeal history</h2>
        <span className="text-xs text-slate-500">{appeals.length}</span>
      </div>

      <div className="space-y-3">
        {appeals.map((a, i) => {
          const mod = modMap[a.moderation_id];
          const StatusIcon = STATUS_ICON[a.status] || Clock;
          const style = STATUS_STYLES[a.status] || STATUS_STYLES.Pending;
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
              className={`rounded-2xl bg-white/[0.03] border border-white/10 border-l-2 ${style.accent} p-5`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar className="h-3.5 w-3.5" /> {new Date(a.created_date).toLocaleDateString()}
                  </div>
                  <div className="mt-1.5 text-sm text-slate-400">
                    Appeal for <span className="text-white font-medium">{mod?.moderation_type || 'Moderation'}</span>
                    {mod?.reason ? <span className="text-slate-500"> — {mod.reason}</span> : null}
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{a.appeal_reason}</p>
                </div>
                <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${style.badge}`}>
                  <StatusIcon className="h-3.5 w-3.5" /> {a.status}
                </span>
              </div>

              <AppealTimeline status={a.status} />

              {a.staff_response ? (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-slate-950/50 border border-white/10 p-3">
                  <MessageSquare className="h-4 w-4 text-cyan-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-slate-400 mb-0.5">Decision from the moderation team</div>
                    <p className="text-sm text-slate-200">{a.staff_response}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-xs text-slate-500">No decision yet — your appeal is awaiting review.</p>
              )}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}