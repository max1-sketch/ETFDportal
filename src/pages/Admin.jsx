import { useAuth } from '@/lib/AuthContext';
import { isOwner } from '@/lib/isOwner';
import SiteNav from '@/components/SiteNav';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ShieldAlert, Gavel, Shield, Users, Search, Ban, ScrollText, LayoutDashboard } from 'lucide-react';
import AppealsTab from '@/components/admin/AppealsTab';
import ModerationsTab from '@/components/admin/ModerationsTab';
import UsersTab from '@/components/admin/UsersTab';
import StaffLogsTab from '@/components/admin/StaffLogsTab';
import UserLookup from '@/components/admin/UserLookup';
import WebsiteBansTab from '@/components/admin/WebsiteBansTab';
import DashboardTab from '@/components/admin/DashboardTab';

export default function Admin() {
  const { user } = useAuth();

  if (!isOwner(user) && user?.role !== 'staff') {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <SiteNav />
        <main className="max-w-3xl mx-auto px-5 pt-28 pb-20 text-center">
          <div className="h-14 w-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="h-7 w-7 text-rose-400" />
          </div>
          <h1 className="font-display text-2xl font-bold">Staff only</h1>
          <p className="mt-2 text-slate-400">You need a staff or admin account to access this dashboard.</p>
        </main>
      </div>
    );
  }

  const isAdmin = isOwner(user);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <SiteNav />
      <main className="max-w-5xl mx-auto px-5 pt-28 pb-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs font-medium text-rose-300 mb-4">
          <ShieldAlert className="h-3.5 w-3.5" /> Staff Dashboard
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Moderation console</h1>
        <p className="mt-2 text-slate-400">Review appeals, issue moderations, and manage staff access.</p>

        <Tabs defaultValue="appeals" className="mt-8">
          <TabsList className="flex w-full overflow-x-auto bg-white/5 border border-white/10 h-11 rounded-xl">
            <TabsTrigger value="appeals" className="shrink-0 gap-1.5 data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg"><Gavel className="h-3.5 w-3.5" /> Appeals</TabsTrigger>
            <TabsTrigger value="moderations" className="shrink-0 gap-1.5 data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg"><Shield className="h-3.5 w-3.5" /> Moderations</TabsTrigger>
            {isAdmin && <TabsTrigger value="users" className="shrink-0 gap-1.5 data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg"><Users className="h-3.5 w-3.5" /> Users</TabsTrigger>}
            <TabsTrigger value="lookup" className="shrink-0 gap-1.5 data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg"><Search className="h-3.5 w-3.5" /> User Lookup</TabsTrigger>
            {isAdmin && <TabsTrigger value="bans" className="shrink-0 gap-1.5 data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg"><Ban className="h-3.5 w-3.5" /> Website Bans</TabsTrigger>}
            {isAdmin && <TabsTrigger value="logs" className="shrink-0 gap-1.5 data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg"><ScrollText className="h-3.5 w-3.5" /> Staff Logs</TabsTrigger>}
            {isAdmin && <TabsTrigger value="dashboard" className="shrink-0 gap-1.5 data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg"><LayoutDashboard className="h-3.5 w-3.5" /> Dashboard</TabsTrigger>}
          </TabsList>
          <TabsContent value="appeals"><AppealsTab /></TabsContent>
          <TabsContent value="moderations"><ModerationsTab /></TabsContent>
          {isAdmin && <TabsContent value="users"><UsersTab /></TabsContent>}
          <TabsContent value="lookup"><UserLookup /></TabsContent>
          {isAdmin && <TabsContent value="bans"><WebsiteBansTab /></TabsContent>}
          {isAdmin && <TabsContent value="logs"><StaffLogsTab /></TabsContent>}
          {isAdmin && <TabsContent value="dashboard"><DashboardTab /></TabsContent>}
          </Tabs>
      </main>
    </div>
  );
}