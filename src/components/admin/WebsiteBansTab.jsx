const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldBan, Trash2, Plus, Loader2, Globe } from 'lucide-react';

export default function WebsiteBansTab() {
  const [bans, setBans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ip, setIp] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => { loadBans(); }, []);

  const loadBans = async () => {
    try {
      setLoading(true);
      const data = await db.entities.IpBan.list('-created_date', 100);
      setBans(data);
    } catch {
      toast({ title: 'Failed to load IP bans', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async (e) => {
    e.preventDefault();
    if (!ip.trim()) return;
    setSubmitting(true);
    try {
      await db.entities.IpBan.create({
        ip_address: ip.trim(),
        reason: reason.trim() || 'Banned by staff',
        banned_by: user?.email || 'Unknown',
      });
      setIp('');
      setReason('');
      toast({ title: 'IP banned successfully' });
      loadBans();
    } catch {
      toast({ title: 'Failed to ban IP', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await db.entities.IpBan.delete(id);
      toast({ title: 'Ban removed' });
      loadBans();
    } catch {
      toast({ title: 'Failed to remove ban', variant: 'destructive' });
    }
  };

  return (
    <div className="mt-6 space-y-6">
      <form onSubmit={handleBan} className="rounded-2xl bg-white/[0.04] border border-white/10 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldBan className="h-5 w-5 text-rose-400" />
          <h3 className="font-display font-semibold text-white">Ban a new IP address</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-slate-300">IP Address</Label>
            <Input
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="e.g. 192.168.1.1"
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Reason</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for ban"
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
            />
          </div>
        </div>
        <Button type="submit" disabled={submitting || !ip.trim()} className="bg-rose-600 hover:bg-rose-500 text-white border-0">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Ban IP
        </Button>
      </form>

      <div>
        <h3 className="font-display font-semibold text-white mb-3">Active IP Bans ({bans.length})</h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
          </div>
        ) : bans.length === 0 ? (
          <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-8 text-center">
            <Globe className="h-8 w-8 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400">No active IP bans. The website is accessible to all visitors.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {bans.map((ban) => (
              <div key={ban.id} className="flex items-center justify-between rounded-xl bg-white/[0.04] border border-white/10 p-4">
                <div className="min-w-0">
                  <div className="font-mono text-white text-sm">{ban.ip_address}</div>
                  <div className="text-sm text-slate-400 truncate">{ban.reason}</div>
                  <div className="text-xs text-slate-500 mt-1">Banned by {ban.banned_by || 'Unknown'}</div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(ban.id)}
                  className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}