import { Lock, Snowflake, MessageSquare, Sparkles, UserCheck, Hash, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

function ToggleRow({ icon: Icon, title, description, value, onChange, color = 'cyan' }) {
  const colorMap = {
    cyan: 'bg-cyan-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    emerald: 'bg-emerald-500',
    violet: 'bg-violet-500',
  };
  return (
    <div className="flex items-start justify-between gap-3 py-3">
      <div className="flex items-start gap-3 flex-1">
        <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
          <Icon className="h-4 w-4 text-slate-400" />
        </div>
        <div>
          <div className="text-sm font-medium text-white">{title}</div>
          <div className="text-xs text-slate-500 mt-0.5">{description}</div>
        </div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 rounded-full transition-colors shrink-0 mt-0.5 ${value ? colorMap[color] : 'bg-white/10'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

export default function DashboardPortalControls({ settings, update }) {
  const { toast } = useToast();

  const resetDefaults = async () => {
    try {
      await update({
        portal_locked: false,
        appeals_frozen: false,
        feature_showcase_enabled: true,
        auto_verify_enabled: false,
        max_appeals_per_user: 3,
        welcome_message: '',
      });
      toast({ title: 'Portal settings reset to defaults' });
    } catch {
      toast({ title: 'Failed to reset settings', variant: 'destructive' });
    }
  };

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6">
      <div className="flex items-center gap-2 mb-5">
        <Lock className="h-5 w-5 text-cyan-400" />
        <h3 className="text-base font-semibold text-white">Portal Controls</h3>
      </div>

      {/* Toggles */}
      <div className="divide-y divide-white/5">
        <ToggleRow
          icon={Lock}
          title="Portal Lock (Read-Only)"
          description="Prevents users from submitting new appeals or interacting with portal forms. Existing data stays visible."
          value={settings.portal_locked}
          onChange={(v) => update({ portal_locked: v })}
          color="amber"
        />
        <ToggleRow
          icon={Snowflake}
          title="Freeze New Appeals"
          description="Temporarily stops players from submitting new appeals. Existing appeals remain reviewable."
          value={settings.appeals_frozen}
          onChange={(v) => update({ appeals_frozen: v })}
          color="violet"
        />
        <ToggleRow
          icon={Sparkles}
          title="Community Showcase"
          description="Showcases community features and highlights on the portal home page."
          value={settings.feature_showcase_enabled}
          onChange={(v) => update({ feature_showcase_enabled: v })}
          color="emerald"
        />
        <ToggleRow
          icon={UserCheck}
          title="Auto-Verify New Users"
          description="Skips the Roblox bio verification step for new users (not recommended for production)."
          value={settings.auto_verify_enabled}
          onChange={(v) => update({ auto_verify_enabled: v })}
          color="rose"
        />
      </div>

      {/* Welcome message */}
      <div className="mt-5 pt-5 border-t border-white/10">
        <Label className="text-sm text-slate-300 mb-2 block flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> Welcome Message</Label>
        <Textarea
          value={settings.welcome_message || ''}
          onChange={(e) => update({ welcome_message: e.target.value })}
          placeholder="Welcome to the Escape Tsunami Player Portal! Track your moderation history and submit appeals."
          className="bg-slate-950/60 border-white/15 text-white min-h-[60px]"
        />
        <p className="text-xs text-slate-500 mt-1">Shown to visitors on the home page. Leave empty for the default message.</p>
      </div>

      {/* Max appeals */}
      <div className="mt-5 pt-5 border-t border-white/10">
        <Label className="text-sm text-slate-300 mb-2 block flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" /> Max Appeals Per User</Label>
        <Input
          type="number"
          min="1"
          max="20"
          value={settings.max_appeals_per_user ?? 3}
          onChange={(e) => update({ max_appeals_per_user: parseInt(e.target.value) || 3 })}
          className="bg-slate-950/60 border-white/15 text-white max-w-32"
        />
        <p className="text-xs text-slate-500 mt-1">Maximum number of appeals a player can submit at once.</p>
      </div>

      {/* Reset */}
      <div className="mt-5 pt-5 border-t border-white/10">
        <button
          onClick={resetDefaults}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset portal controls to defaults
        </button>
      </div>
    </div>
  );
}