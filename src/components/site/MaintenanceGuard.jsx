const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/AuthContext';
import { isOwner } from '@/lib/isOwner';
import { Wrench, Clock, ShieldCheck, RefreshCw } from 'lucide-react';

export default function MaintenanceGuard({ children }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await db.entities.SiteSettings.list('-updated_date', 1);
        if (mounted) setSettings(list?.[0] || null);
      } catch {
        /* ignore — if settings can't load, don't block the site */
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return children;

  const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];
  const isAuthRoute = typeof window !== 'undefined' && AUTH_ROUTES.some((r) => window.location.pathname.startsWith(r));

  if (settings?.maintenance_mode && user && !isOwner(user) && !isAuthRoute) {
    return <MaintenanceScreen message={settings.maintenance_message} scheduledUntil={settings.maintenance_scheduled_until} />;
  }

  return children;
}

function MaintenanceScreen({ message, scheduledUntil }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const remaining = scheduledUntil ? new Date(scheduledUntil).getTime() - now : null;
  const overdue = remaining !== null && remaining < 0;

  const formatCountdown = (ms) => {
    if (ms < 0) return '00:00:00';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex items-center justify-center px-5 overflow-y-auto">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl animate-pulse-slow" />
      </div>

      <div className="relative max-w-lg w-full text-center py-10">
        <div className="relative mx-auto mb-8 h-24 w-24">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 animate-pulse-slow" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Wrench className="h-12 w-12 text-cyan-400 animate-pulse-slow" />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-medium text-cyan-300 mb-4">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse-slow" /> Under Maintenance
        </div>

        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
          We'll be right back
        </h1>
        <p className="mt-3 text-slate-400 text-base leading-relaxed">
          {message || 'Escape Tsunami Portal is currently undergoing scheduled maintenance. We apologize for the inconvenience — please check back shortly.'}
        </p>

        {remaining !== null && !overdue && (
          <div className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white/[0.03] border border-white/10 px-5 py-3">
            <Clock className="h-4 w-4 text-cyan-400" />
            <span className="text-xs text-slate-400">Estimated time remaining</span>
            <span className="font-mono text-lg font-bold text-cyan-300 tabular-nums">{formatCountdown(remaining)}</span>
          </div>
        )}

        {overdue && (
          <div className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 px-4 py-2 text-sm text-amber-300">
            <Clock className="h-4 w-4" /> Maintenance is taking longer than expected…
          </div>
        )}

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-600">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Owners and staff can still access the portal while maintenance is active.</span>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry connection
        </button>
      </div>
    </div>
  );
}