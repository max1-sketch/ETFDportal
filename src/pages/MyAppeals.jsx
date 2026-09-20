const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import { useAuth } from '@/lib/AuthContext';
import { Loader2, ShieldCheck, Gavel, Clock, CheckCircle2, XCircle, MessageSquare, ArrowLeft } from 'lucide-react';
import SiteNav from '@/components/SiteNav';
import VerifyAccount from '@/components/moderations/VerifyAccount';
import { Button } from '@/components/ui/button';

const STATUS_STYLES = {
  'Pending': { cls: 'bg-amber-500/10 text-amber-300 border-amber-500/20', icon: Clock, label: 'Pending' },
  'Under Review': { cls: 'bg-violet-500/10 text-violet-300 border-violet-500/20', icon: Loader2, label: 'Under Review' },
  'Approved': { cls: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20', icon: CheckCircle2, label: 'Approved' },
  'Denied': { cls: 'bg-rose-500/10 text-rose-300 border-rose-500/20', icon: XCircle, label: 'Denied' },
};

export default function MyAppeals() {
  const { user } = useAuth();
  const [savedUsername, setSavedUsername] = useState('');
  const [appeals, setAppeals] = useState([]);
  const [moderations, setModerations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.roblox_username) setSavedUsername(user.roblox_username);
  }, [user]);

  useEffect(() => {
    if (!savedUsername) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      try {
        const [apps, mods] = await Promise.all([
          db.entities.Appeal.filter({ roblox_username: savedUsername }, '-created_date', 100),
          db.entities.Moderation.filter({ roblox_username: savedUsername }, '-moderation_date', 100),
        ]);
        setAppeals(apps || []);
        setModerations(mods || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [savedUsername]);

  const handleVerified = async (username) => {
    setSavedUsername(username);
    if (user) { try { await db.auth.updateMe({ roblox_username: username }); } catch {} }
  };

  const modFor = (id) => moderations.find((m) => m.id === id);

  if (!savedUsername) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <SiteNav />
        <main className="max-w-2xl mx-auto px-5 pt-28 pb-20">
          <VerifyAccount onVerified={handleVerified} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <SiteNav />
      <main className="max-w-4xl mx-auto px-5 pt-28 pb-20">
        <Link to="/portal" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Portal
        </Link>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-medium text-cyan-300 mb-4">
            <Gavel className="h-3.5 w-3.5" /> My Appeals
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Manage your appeals</h1>
          <p className="mt-2 text-slate-400">Track the status of every appeal you've submitted for <span className="text-cyan-300 font-medium">{savedUsername}</span>.</p>
        </motion.div>

        {/* Summary stats */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {[
            { label: 'Total', value: appeals.length, icon: Gavel, cls: 'text-white', accent: 'text-cyan-400' },
            { label: 'Pending', value: appeals.filter(a => a.status === 'Pending').length, icon: Clock, cls: 'text-amber-300', accent: 'text-amber-400' },
            { label: 'Approved', value: appeals.filter(a => a.status === 'Approved').length, icon: CheckCircle2, cls: 'text-emerald-300', accent: 'text-emerald-400' },
            { label: 'Denied', value: appeals.filter(a => a.status === 'Denied').length, icon: XCircle, cls: 'text-rose-300', accent: 'text-rose-400' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white/[0.03] border border-white/10 p-3 sm:p-4 text-center hover:border-cyan-500/20 transition-colors">
              <s.icon className={`h-4 w-4 mx-auto mb-1.5 ${s.accent}`} />
              <div className={`text-xl sm:text-2xl font-bold ${s.cls}`}>{s.value}</div>
              <div className="text-[11px] sm:text-xs text-slate-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Appeals list */}
        <div className="mt-8 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading your appeals…
            </div>
          ) : appeals.length === 0 ? (
            <div className="rounded-2xl bg-white/[0.03] border border-white/10 py-20 text-center">
              <div className="h-14 w-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="h-7 w-7 text-cyan-400" />
              </div>
              <h3 className="font-semibold text-lg text-white">No appeals yet</h3>
              <p className="mt-1.5 text-sm text-slate-400 max-w-sm mx-auto">
                You haven't submitted any appeals. Visit the Member Portal to view your moderations and appeal if needed.
              </p>
              <Link to="/portal" className="inline-block mt-4">
                <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-0">
                  Go to Member Portal
                </Button>
              </Link>
            </div>
          ) : (
            appeals.map((a, i) => {
              const mod = modFor(a.moderation_id);
              const st = STATUS_STYLES[a.status] || STATUS_STYLES['Pending'];
              const StatusIcon = st.icon;
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className="rounded-2xl bg-white/[0.03] border border-white/10 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-slate-500">{new Date(a.created_date).toLocaleString()}</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${st.cls}`}>
                          <StatusIcon className="h-3 w-3" /> {st.label}
                        </span>
                      </div>
                      <div className="mt-1.5 text-sm">
                        <span className="text-white font-medium">{mod?.moderation_type || 'Moderation'}</span>
                        {mod?.reason && <span className="text-slate-500"> — {mod.reason}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 space-y-3">
                    {a.appeal_reason && (
                      <div>
                        <div className="text-[11px] text-slate-500 uppercase tracking-wide font-medium mb-1">What happened</div>
                        <p className="text-sm text-slate-300">{a.appeal_reason}</p>
                      </div>
                    )}
                    {a.why_accepted && (
                      <div>
                        <div className="text-[11px] text-slate-500 uppercase tracking-wide font-medium mb-1">Why it should be accepted</div>
                        <p className="text-sm text-slate-300">{a.why_accepted}</p>
                      </div>
                    )}
                    {a.deserved_infraction && (
                      <div>
                        <div className="text-[11px] text-slate-500 uppercase tracking-wide font-medium mb-1">Did you deserve it?</div>
                        <p className="text-sm text-slate-300">{a.deserved_infraction}</p>
                      </div>
                    )}
                  </div>

                  {a.staff_response && (
                    <div className="mt-4 rounded-xl bg-cyan-500/[0.06] border border-cyan-500/15 p-3">
                      <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 uppercase tracking-wide font-medium mb-1">
                        <MessageSquare className="h-3.5 w-3.5" /> Staff response
                      </div>
                      <p className="text-sm text-slate-200">{a.staff_response}</p>
                    </div>
                  )}

                  {a.status === 'Denied' && a.can_reappeal === false && (
                    <div className="mt-3 text-xs text-rose-400/80">This appeal was denied and you are not eligible to submit a new one for this moderation.</div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}