const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/AuthContext';
import { isOwner } from '@/lib/isOwner';
import { ShieldAlert, Loader2, BarChart3, Users, Shield, Gavel } from 'lucide-react';
import SiteNav from '@/components/SiteNav';
import AnalyticsStats from '@/components/analytics/AnalyticsStats';
import ModerationAnalytics from '@/components/analytics/ModerationAnalytics';
import AppealAnalytics from '@/components/analytics/AppealAnalytics';
import StaffActivity from '@/components/analytics/StaffActivity';
import StaffSearch from '@/components/analytics/StaffSearch';
import TrendChart from '@/components/analytics/TrendChart';
import ReasonBreakdown from '@/components/analytics/ReasonBreakdown';
import RepeatOffenders from '@/components/analytics/RepeatOffenders';
import ActivityHeatmap from '@/components/analytics/ActivityHeatmap';
import StaffAudit from '@/components/analytics/StaffAudit';
import GameAnalytics from '@/components/analytics/GameAnalytics';

export default function Analytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [moderations, setModerations] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (!isOwner(user)) return;
    localStorage.setItem('analytics_last_visited', new Date().toISOString());
    (async () => {
      try {
        const [mods, apps, staffLogs] = await Promise.all([
          db.entities.Moderation.list('-created_date', 500),
          db.entities.Appeal.list('-created_date', 500),
          db.entities.StaffLog.list('-created_date', 500),
        ]);
        setModerations(mods || []);
        setAppeals(apps || []);
        setLogs(staffLogs || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (!isOwner(user)) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <SiteNav />
        <main className="max-w-3xl mx-auto px-5 pt-28 pb-20 text-center">
          <div className="h-14 w-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="h-7 w-7 text-rose-400" />
          </div>
          <h1 className="font-display text-2xl font-bold">Owners only</h1>
          <p className="mt-2 text-slate-400">You need an owner account to view analytics.</p>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <SiteNav />
        <div className="flex items-center justify-center pt-28 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-400 mr-2" /> Loading analytics…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <SiteNav />
      <main className="max-w-5xl mx-auto px-5 pt-28 pb-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-medium text-violet-300 mb-4">
          <BarChart3 className="h-3.5 w-3.5" /> Owner Analytics
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Moderation insights</h1>
        <p className="mt-2 text-slate-400">Track moderations, appeals, and staff activity across the portal.</p>

        {/* Game Performance */}
        <GameAnalytics />

        {/* Overview */}
        <div className="mt-10 mb-4 flex items-center gap-2">
          <div className="h-px flex-1 bg-white/10" />
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-semibold tracking-[0.15em] uppercase text-violet-300">
            <BarChart3 className="h-3.5 w-3.5" /> Overview
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>
        <AnalyticsStats moderations={moderations} appeals={appeals} logs={logs} />
        <TrendChart moderations={moderations} appeals={appeals} />

        {/* Staff Analytics */}
        <div className="mt-10 mb-4 flex items-center gap-2">
          <div className="h-px flex-1 bg-white/10" />
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-semibold tracking-[0.15em] uppercase text-cyan-300">
            <Users className="h-3.5 w-3.5" /> Staff Analytics
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>
        <StaffSearch moderations={moderations} appeals={appeals} logs={logs} />
        <StaffAudit moderations={moderations} appeals={appeals} logs={logs} />
        <StaffActivity logs={logs} />

        {/* Moderation Analytics */}
        <div className="mt-10 mb-4 flex items-center gap-2">
          <div className="h-px flex-1 bg-white/10" />
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs font-semibold tracking-[0.15em] uppercase text-rose-300">
            <Shield className="h-3.5 w-3.5" /> Moderation Analytics
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          <ReasonBreakdown moderations={moderations} />
          <RepeatOffenders moderations={moderations} />
        </div>
        <ActivityHeatmap moderations={moderations} appeals={appeals} />
        <ModerationAnalytics moderations={moderations} />

        {/* Appeal Analytics */}
        <div className="mt-10 mb-4 flex items-center gap-2">
          <div className="h-px flex-1 bg-white/10" />
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold tracking-[0.15em] uppercase text-amber-300">
            <Gavel className="h-3.5 w-3.5" /> Appeal Analytics
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>
        <AppealAnalytics appeals={appeals} logs={logs} />
      </main>
    </div>
  );
}