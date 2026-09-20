const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { Link, useLocation } from 'react-router-dom';
import { Waves, LogIn, Menu, X, Home, Scale, ShieldCheck, BarChart3, AlertTriangle, Megaphone, LayoutDashboard } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

import { useAuth } from '@/lib/AuthContext';
import { isOwner } from '@/lib/isOwner';
import { useDesktopApp } from '@/hooks/useDesktopApp';

const GAME_URL = 'https://www.roblox.com/games/103398581793479/Escape-Tsunami-For-Developers';

export default function SiteNav() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const isDesktopApp = useDesktopApp();
  const isDesktopLayout = isDesktopApp || new URLSearchParams(window.location.search).has('splash');
  const [hasNewActivity, setHasNewActivity] = useState(false);
  const [siteSettings, setSiteSettings] = useState(null);
  const [topAnnouncement, setTopAnnouncement] = useState(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);

  useEffect(() => {
    if (!isOwner(user)) return;
    (async () => {
      try {
        const [latestMod, latestAppeal] = await Promise.all([
          db.entities.Moderation.list('-created_date', 1),
          db.entities.Appeal.list('-created_date', 1),
        ]);
        const lastVisited = localStorage.getItem('analytics_last_visited');
        const lastVisitedTime = lastVisited ? new Date(lastVisited).getTime() : 0;
        const modTime = latestMod?.[0]?.created_date ? new Date(latestMod[0].created_date).getTime() : 0;
        const appealTime = latestAppeal?.[0]?.created_date ? new Date(latestAppeal[0].created_date).getTime() : 0;
        setHasNewActivity(modTime > lastVisitedTime || appealTime > lastVisitedTime);
      } catch {}
    })();
  }, [user, location.pathname]);

  useEffect(() => {
    (async () => {
      try {
        const [settingsList, announcements] = await Promise.all([
          db.entities.SiteSettings.list('-updated_date', 1),
          db.entities.Announcement.list('-created_date', 20),
        ]);
        setSiteSettings(settingsList?.[0] || null);
        const now = Date.now();
        const active = (announcements || []).filter(
          (a) => a.active && (!a.expires_at || new Date(a.expires_at).getTime() > now)
        );
        const pinned = active.filter((a) => a.pinned);
        setTopAnnouncement(pinned[0] || active[0] || null);
      } catch {}
    })();
  }, [location.pathname]);

  const desktopLinks = [
    { label: 'Home', to: '/', icon: Home },
    { label: 'My Appeals', to: '/my-appeals', icon: Scale },
    ...((isOwner(user) || user?.role === 'staff' || user?.role === 'admin') ? [{ label: 'Staff', to: '/admin', icon: ShieldCheck }] : []),
    ...(isOwner(user) ? [{ label: 'Analytics', to: '/analytics', icon: BarChart3, showDot: hasNewActivity }] : []),
    ...(isOwner(user) ? [{ label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard }] : []),
  ];
  const mobileLinks = [
    { label: 'Home', to: '/', icon: Home },
    { label: 'Member Portal', to: '/portal', icon: LogIn },
    { label: 'My Appeals', to: '/my-appeals', icon: Scale },
    ...((isOwner(user) || user?.role === 'staff' || user?.role === 'admin') ? [{ label: 'Staff', to: '/admin', icon: ShieldCheck }] : []),
    ...(isOwner(user) ? [{ label: 'Analytics', to: '/analytics', icon: BarChart3, showDot: hasNewActivity }] : []),
    ...(isOwner(user) ? [{ label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard }] : []),
  ];

  const BANNER_COLORS = {
    cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-200',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-200',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-200',
    violet: 'bg-violet-500/10 border-violet-500/20 text-violet-200',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200',
  };

  const showEmergency = siteSettings?.emergency_alert_enabled && siteSettings?.emergency_alert_message;
  const showBanner = siteSettings?.banner_enabled && siteSettings?.banner_message && !bannerDismissed;
  const showAnnouncement = topAnnouncement && !announcementDismissed;
  const barOffset = (showEmergency ? 36 : 0) + (showBanner ? 40 : 0) + (showAnnouncement ? 40 : 0);

  return (
    <>
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-slate-950/60 border-b border-white/10">
      {showEmergency && (
        <div className="bg-rose-600 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{siteSettings.emergency_alert_message}</span>
        </div>
      )}
      {showBanner && (
        <div className={`relative px-4 py-2.5 text-center text-sm flex items-center justify-center gap-2 border-b border-white/5 ${BANNER_COLORS[siteSettings.banner_color] || BANNER_COLORS.cyan}`}>
          <Megaphone className="h-4 w-4 shrink-0" />
          <span className="truncate">{siteSettings.banner_message}</span>
          {siteSettings.banner_dismissible && (
            <button onClick={() => setBannerDismissed(true)} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
      {showAnnouncement && (
        <div className="px-4 py-2 text-center text-sm flex items-center justify-center gap-2 bg-white/[0.03] border-b border-white/5 text-slate-300">
          <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/20 shrink-0">{topAnnouncement.type || 'info'}</span>
          <span className="font-medium text-white shrink-0">{topAnnouncement.title}:</span>
          <span className="truncate">{topAnnouncement.body}</span>
          <button onClick={() => setAnnouncementDismissed(true)} className="opacity-60 hover:opacity-100 ml-2 shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <div className={`max-w-6xl mx-auto px-5 h-16 flex items-center ${isDesktopLayout ? 'gap-6' : 'justify-between'}`}>
        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/30">
            <Waves className="h-5 w-5 text-white" strokeWidth={2.5} />
          </span>
          <span className="font-display font-semibold text-white tracking-tight text-[15px] leading-tight">
            Escape Tsunami
            <span className="block text-[10px] font-normal text-cyan-300/80 tracking-[0.18em] uppercase">For Developers</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {desktopLinks.map((l) => {
            const active = location.pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 inline-flex items-center gap-1.5 ${
                  active ? 'text-white border-cyan-400' : 'text-slate-300 hover:text-white border-transparent'
                }`}
              >
                {l.icon && <l.icon className="h-3.5 w-3.5" />}
                {l.label}
                {l.showDot && (
                  <span className="inline-block h-2 w-2 rounded-full bg-blue-500 ml-0.5" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Link to="/portal">
            <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-0">
              <LogIn className="h-4 w-4 mr-1.5" /> Member Portal
            </Button>
          </Link>
        </div>

        {isDesktopLayout && <div className="flex-1" />}

        <button
          className="md:hidden text-white p-2"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/10 bg-slate-950/95 px-5 py-4 space-y-1">
          {mobileLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-slate-200 hover:bg-white/5 text-sm"
            >
              {l.icon && <l.icon className="h-4 w-4 text-cyan-400/70" />}
              {l.label}
              {l.showDot && (
                <span className="inline-block h-2 w-2 rounded-full bg-blue-500 ml-auto" />
              )}
            </Link>
          ))}
          <a href={GAME_URL} target="_blank" rel="noreferrer" className="block px-3 py-2.5 rounded-lg text-cyan-300 text-sm">
            Play on Roblox ↗
          </a>
        </div>
      )}
    </header>
    {barOffset > 0 && <div style={{ height: `${barOffset}px` }} aria-hidden="true" />}
    </>
  );
}