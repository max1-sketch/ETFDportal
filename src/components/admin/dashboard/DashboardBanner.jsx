import { Megaphone, X, Palette } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const COLOR_OPTIONS = [
  { value: 'cyan', label: 'Cyan', cls: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' },
  { value: 'amber', label: 'Amber', cls: 'bg-amber-500/20 border-amber-500/40 text-amber-300' },
  { value: 'rose', label: 'Rose', cls: 'bg-rose-500/20 border-rose-500/40 text-rose-300' },
  { value: 'violet', label: 'Violet', cls: 'bg-violet-500/20 border-violet-500/40 text-violet-300' },
  { value: 'emerald', label: 'Emerald', cls: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' },
];

export default function DashboardBanner({ settings, update }) {
  const { toast } = useToast();

  const toggleBanner = async () => {
    if (!settings.banner_enabled && !settings.banner_message) {
      toast({ title: 'Add a banner message first', variant: 'destructive' });
      return;
    }
    try {
      await update({ banner_enabled: !settings.banner_enabled });
      toast({ title: settings.banner_enabled ? 'Banner hidden' : 'Banner published' });
    } catch {
      toast({ title: 'Failed to toggle banner', variant: 'destructive' });
    }
  };

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6">
      <div className="flex items-center gap-2 mb-5">
        <Megaphone className="h-5 w-5 text-cyan-400" />
        <h3 className="text-base font-semibold text-white">Site Banner / Hint Bar</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full border ml-auto ${settings.banner_enabled ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-white/5 text-slate-500 border-white/10'}`}>
          {settings.banner_enabled ? 'LIVE' : 'HIDDEN'}
        </span>
      </div>

      <p className="text-sm text-slate-400 mb-4">Show a dismissible hint bar at the top of every page with a custom message and color.</p>

      {/* Preview */}
      {settings.banner_enabled && settings.banner_message && (
        <div className={`mb-4 rounded-xl border px-4 py-2.5 text-sm flex items-center gap-2 ${COLOR_OPTIONS.find((c) => c.value === settings.banner_color)?.cls || COLOR_OPTIONS[0].cls}`}>
          <Megaphone className="h-4 w-4 shrink-0" />
          <span className="flex-1">{settings.banner_message}</span>
          {settings.banner_dismissible && <X className="h-4 w-4 opacity-60" />}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label className="text-sm text-slate-300 mb-2 block">Banner Message</Label>
          <Textarea
            value={settings.banner_message || ''}
            onChange={(e) => update({ banner_message: e.target.value })}
            placeholder="Check out our new community showcase! 🌊"
            className="bg-slate-950/60 border-white/15 text-white min-h-[60px]"
          />
        </div>

        <div>
          <Label className="text-sm text-slate-300 mb-2 block flex items-center gap-1.5"><Palette className="h-3.5 w-3.5" /> Color</Label>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.value}
                onClick={() => update({ banner_color: c.value })}
                className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                  settings.banner_color === c.value ? c.cls : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <button
              onClick={() => update({ banner_dismissible: !settings.banner_dismissible })}
              className={`relative h-5 w-9 rounded-full transition-colors ${settings.banner_dismissible ? 'bg-cyan-500' : 'bg-white/10'}`}
            >
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${settings.banner_dismissible ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
            <span className="text-sm text-slate-300">Dismissible by users</span>
          </label>

          <button
            onClick={toggleBanner}
            disabled={!settings.banner_message}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-40 ${
              settings.banner_enabled
                ? 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
                : 'bg-cyan-500 border-cyan-400 text-white hover:bg-cyan-400'
            }`}
          >
            {settings.banner_enabled ? 'Hide Banner' : 'Publish Banner'}
          </button>
        </div>
      </div>
    </div>
  );
}