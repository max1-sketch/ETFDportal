import { ShieldAlert, Lock, Siren, RotateCcw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useState } from 'react';

export default function DashboardLockdown({ settings, update }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const lockdownActive =
    settings.portal_locked && settings.appeals_frozen && settings.emergency_alert_enabled;

  const toggleLockdown = async (enable) => {
    setBusy(true);
    try {
      if (enable) {
        await update({
          portal_locked: true,
          appeals_frozen: true,
          emergency_alert_enabled: true,
          emergency_alert_message: settings.emergency_alert_message || 'The portal is currently in lockdown. New appeals are paused and the portal is read-only.',
          site_status: 'degraded',
        });
        toast({ title: '🔒 Lockdown mode activated', description: 'Appeals frozen, portal locked, emergency alert enabled.' });
      } else {
        await update({
          portal_locked: false,
          appeals_frozen: false,
          emergency_alert_enabled: false,
          site_status: 'operational',
        });
        toast({ title: 'Lockdown lifted', description: 'Portal returned to normal operations.' });
      }
    } catch {
      toast({ title: 'Failed to toggle lockdown', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`rounded-2xl border p-6 transition-colors ${
      lockdownActive
        ? 'bg-rose-500/10 border-rose-500/30'
        : 'bg-white/[0.03] border-white/10'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
            lockdownActive ? 'bg-rose-500/20 border border-rose-500/30' : 'bg-white/5 border border-white/10'
          }`}>
            <Siren className={`h-5 w-5 ${lockdownActive ? 'text-rose-400' : 'text-slate-400'}`} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              Lockdown Mode
              {lockdownActive && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Active
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              Emergency override for raids or large incidents. Instantly freezes new appeals, locks the portal to read-only, and broadcasts an emergency alert — all in one toggle.
            </p>
          </div>
        </div>
        <button
          onClick={() => toggleLockdown(!lockdownActive)}
          disabled={busy}
          className={`relative h-7 w-14 rounded-full transition-colors shrink-0 disabled:opacity-50 ${
            lockdownActive ? 'bg-rose-500' : 'bg-white/10'
          }`}
        >
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            lockdownActive ? 'translate-x-7' : 'translate-x-1'
          }`} />
        </button>
      </div>

      {lockdownActive && (
        <div className="mt-4 pt-4 border-t border-rose-500/20 flex items-center gap-2 text-xs text-rose-300">
          <ShieldAlert className="h-3.5 w-3.5" />
          Portal is locked, appeals frozen, emergency alert live.
        </div>
      )}
    </div>
  );
}