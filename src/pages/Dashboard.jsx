import SiteNav from '@/components/SiteNav';
import DashboardTab from '@/components/admin/DashboardTab';
import { LayoutDashboard } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <SiteNav />
      <main className="max-w-5xl mx-auto px-5 pt-28 pb-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-medium text-cyan-300 mb-4">
          <LayoutDashboard className="h-3.5 w-3.5" /> Owner Dashboard
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Site control center</h1>
        <p className="mt-2 text-slate-400">Manage maintenance, banners, announcements, lockdown, and portal-wide settings.</p>
        <div className="mt-8">
          <DashboardTab />
        </div>
      </main>
    </div>
  );
}