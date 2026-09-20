import { useState } from 'react';
import { Wrench, AlertTriangle, Clock, Power } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const STATUS_OPTIONS = [
  { value: 'operational', label: 'Operational', color: 'emerald' },
  { value: 'degraded', label: 'Degraded', color: 'amber' },
  { value: 'maintenance', label: 'Maintenance', color: 'violet' },
  { value: 'offline', label: 'Offline', color: 'rose' },
];

const COLOR_CLASSES = {
  emerald: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
  amber: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
  violet: 'bg-violet-500/15 border-violet-500/30 text-violet-300',
  rose: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
};

export default function DashboardMaintenance({ settings, update }) {
  const { toast } = useToast();
  const [confirmMaintenance, setConfirmMaintenance] = useState(false);

  const toggleMaintenance = async () => {
    try {
      await update({ maintenance_mode: !settings.maintenance_mode });
      toast({
        title: settings.maintenance_mode ? 'Maintenance mode disabled' : 'Maintenance mode enabled',
        description: settings.maintenance_mode ? 'The portal is back online for everyone.' : 'Non-owners now see the maintenance screen.',
      });
    } catch {
      toast({ title: 'Failed to toggle maintenance mode', variant: 'destructive' });
    }
    setConfirmMaintenance(false);
  };

  const toggleEmergency = async () => {
    try {
      await update({ emergency_alert_enabled: !settings.emergency_alert_enabled });
      toast({
        title: settings.emergency_alert_enabled ? 'Emergency alert disabled' : 'Emergency alert enabled',
      });
    } catch {
      toast({ title: 'Failed to toggle emergency alert', variant: 'destructive' });
    }
  };

  const setStatus = async (status) => {
    try {
      await update({ site_status: status });
      toast({ title: 'Site status updated' });
    } catch {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    }
  };

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6">
      <div className="flex items-center gap-2 mb-5">
        <Wrench className="h-5 w-5 text-violet-400" />
        <h3 className="text-base font-semibold text-white">Maintenance & Status</h3>
      </div>

      {/* Site status selector */}
      <div className="mb-6">
        <Label className="text-sm text-slate-300 mb-2 block">Site Status</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatus(opt.value)}
              className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                settings.site_status === opt.value
                  ? COLOR_CLASSES[opt.color]
                  : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white hover:border-white/20'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-2">This status indicator is shown to all visitors on the portal.</p>
      </div>

      {/* Maintenance mode toggle */}
      <div className="rounded-xl bg-violet-500/[0.06] border border-violet-500/15 p-4 mb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Power className="h-4 w-4 text-violet-400" />
              <span className="text-sm font-semibold text-white">Maintenance Mode</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${settings.maintenance_mode ? 'bg-violet-500/20 text-violet-300 border-violet-500/30' : 'bg-white/5 text-slate-500 border-white/10'}`}>
                {settings.maintenance_mode ? 'ACTIVE' : 'OFF'}
              </span>
            </div>
            <p className="text-xs text-slate-400">When enabled, non-owners see a full-screen maintenance page. Owners and staff can still access everything.</p>
          </div>
          {confirmMaintenance ? (
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setConfirmMaintenance(false)} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white">Cancel</button>
              <button onClick={toggleMaintenance} className="text-xs px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium">
                {settings.maintenance_mode ? 'Disable' : 'Enable'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmMaintenance(true)}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                settings.maintenance_mode
                  ? 'bg-violet-500/20 border-violet-500/30 text-violet-300 hover:bg-violet-500/30'
                  : 'bg-violet-600 border-violet-500 text-white hover:bg-violet-500'
              }`}
            >
              {settings.maintenance_mode ? 'Turn Off' : 'Turn On'}
            </button>
          )}
        </div>
      </div>

      {/* Maintenance message */}
      <div className="mb-4">
        <Label className="text-sm text-slate-300 mb-2 block">Maintenance Message</Label>
        <Textarea
          value={settings.maintenance_message || ''}
          onChange={(e) => update({ maintenance_message: e.target.value })}
          placeholder="We're performing scheduled maintenance to improve your experience. Please check back soon!"
          className="bg-slate-950/60 border-white/15 text-white min-h-[80px]"
        />
        <p className="text-xs text-slate-500 mt-1">Shown on the maintenance screen to non-owners.</p>
      </div>

      {/* Scheduled until */}
      <div className="mb-6">
        <Label className="text-sm text-slate-300 mb-2 block flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Scheduled Until (optional)</Label>
        <Input
          type="datetime-local"
          value={settings.maintenance_scheduled_until ? new Date(settings.maintenance_scheduled_until).toISOString().slice(0, 16) : ''}
          onChange={(e) => update({ maintenance_scheduled_until: e.target.value ? new Date(e.target.value).toISOString() : null })}
          className="bg-slate-950/60 border-white/15 text-white"
        />
        <p className="text-xs text-slate-500 mt-1">Shows a countdown timer on the maintenance screen.</p>
      </div>

      {/* Emergency alert */}
      <div className="rounded-xl bg-rose-500/[0.06] border border-rose-500/15 p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              <span className="text-sm font-semibold text-white">Emergency Alert Banner</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${settings.emergency_alert_enabled ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-white/5 text-slate-500 border-white/10'}`}>
                {settings.emergency_alert_enabled ? 'ACTIVE' : 'OFF'}
              </span>
            </div>
            <p className="text-xs text-slate-400">Shows a fixed red alert bar at the very top of every page. Use for urgent notices.</p>
          </div>
          <button
            onClick={toggleEmergency}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              settings.emergency_alert_enabled
                ? 'bg-rose-500/20 border-rose-500/30 text-rose-300 hover:bg-rose-500/30'
                : 'bg-rose-600 border-rose-500 text-white hover:bg-rose-500'
            }`}
          >
            {settings.emergency_alert_enabled ? 'Turn Off' : 'Turn On'}
          </button>
        </div>
        <Input
          value={settings.emergency_alert_message || ''}
          onChange={(e) => update({ emergency_alert_message: e.target.value })}
          placeholder="Emergency: Portal may be unstable for the next 30 minutes."
          className="bg-slate-950/60 border-white/15 text-white"
        />
      </div>
    </div>
  );
}