const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState, useCallback } from 'react';

import { useAuth } from '@/lib/AuthContext';
import { Loader2, Settings, Activity, Radio, Pin, Trash2 } from 'lucide-react';
import DashboardMaintenance from '@/components/admin/dashboard/DashboardMaintenance';
import DashboardBanner from '@/components/admin/dashboard/DashboardBanner';
import DashboardAnnouncements from '@/components/admin/dashboard/DashboardAnnouncements';
import DashboardPortalControls from '@/components/admin/dashboard/DashboardPortalControls';
import DashboardLockdown from '@/components/admin/dashboard/DashboardLockdown';

const DEFAULT_SETTINGS = {
  maintenance_mode: false,
  maintenance_message: '',
  maintenance_scheduled_until: null,
  banner_enabled: false,
  banner_message: '',
  banner_color: 'cyan',
  banner_dismissible: true,
  site_status: 'operational',
  welcome_message: '',
  portal_locked: false,
  appeals_frozen: false,
  emergency_alert_enabled: false,
  emergency_alert_message: '',
  feature_showcase_enabled: true,
  auto_verify_enabled: false,
  max_appeals_per_user: 3,
};

const STATUS_STYLES = {
  operational: { label: 'All systems operational', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400' },
  degraded: { label: 'Degraded performance', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30', dot: 'bg-amber-400' },
  maintenance: { label: 'Maintenance in progress', cls: 'bg-violet-500/15 text-violet-300 border-violet-500/30', dot: 'bg-violet-400' },
  offline: { label: 'Portal offline', cls: 'bg-rose-500/15 text-rose-300 border-rose-500/30', dot: 'bg-rose-400' },
};

export default function DashboardTab() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [settingsId, setSettingsId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [activeAnnouncements, setActiveAnnouncements] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsList, users, announcements] = await Promise.all([
        db.entities.SiteSettings.list('-updated_date', 1),
        db.entities.User.list('-created_date', 500),
        db.entities.Announcement.list('-created_date', 50),
      ]);
      const s = settingsList?.[0];
      if (s) {
        setSettings({ ...DEFAULT_SETTINGS, ...s });
        setSettingsId(s.id);
      } else {
        // Create the singleton record if it doesn't exist
        const created = await db.entities.SiteSettings.create({ ...DEFAULT_SETTINGS, updated_by: user?.email || 'Unknown' });
        setSettings({ ...DEFAULT_SETTINGS, ...created });
        setSettingsId(created.id);
      }
      setUserCount(users?.length || 0);
      setActiveAnnouncements((announcements || []).filter((a) => a.active).length);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const update = async (changes) => {
    if (!settingsId) return;
    setSaving(true);
    try {
      const updated = await db.entities.SiteSettings.update(settingsId, {
        ...changes,
        updated_by: user?.email || 'Unknown',
      });
      setSettings((prev) => ({ ...prev, ...updated }));
    } catch (err) {
      throw err;
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-slate-400"><Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading dashboard…</div>;
  }

  const status = STATUS_STYLES[settings.site_status] || STATUS_STYLES.operational;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center">
          <Settings className="h-5 w-5 text-cyan-300" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Owner Dashboard</h2>
          <p className="text-xs text-slate-500">Control announcements, banners, maintenance mode, and portal settings.</p>
        </div>
        {saving && <span className="text-xs text-cyan-400 ml-auto flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Saving…</span>}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`rounded-2xl border p-4 ${status.cls}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`h-2 w-2 rounded-full ${status.dot} animate-pulse-slow`} />
            <span className="text-xs font-medium">Site Status</span>
          </div>
          <div className="text-sm font-semibold">{status.label}</div>
        </div>
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-1 text-slate-400"><Activity className="h-3.5 w-3.5" /><span className="text-xs font-medium">Portal Users</span></div>
          <div className="text-2xl font-bold text-white">{userCount}</div>
        </div>
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-1 text-slate-400"><Radio className="h-3.5 w-3.5" /><span className="text-xs font-medium">Active Announcements</span></div>
          <div className="text-2xl font-bold text-white">{activeAnnouncements}</div>
        </div>
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-1 text-slate-400"><Pin className="h-3.5 w-3.5" /><span className="text-xs font-medium">Maintenance</span></div>
          <div className="text-2xl font-bold text-white">{settings.maintenance_mode ? 'ON' : 'OFF'}</div>
        </div>
      </div>

      {/* Sections */}
      <DashboardLockdown settings={settings} update={update} />
      <DashboardMaintenance settings={settings} update={update} />
      <DashboardBanner settings={settings} update={update} />
      <DashboardAnnouncements user={user} onAnnouncementsChange={load} />
      <DashboardPortalControls settings={settings} update={update} />
    </div>
  );
}