const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react';

import { useAuth } from '@/lib/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Globe, Clock, ShieldBan, User as UserIcon, XCircle, Shield } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { findUserByRobloxUsername } from '@/lib/userLookup';

export default function UserInfoModal({ robloxUsername, open, onClose }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);
  const [banning, setBanning] = useState(false);

  useEffect(() => {
    if (!open || !robloxUsername) return;
    setLoading(true);
    setAccount(null);
    (async () => {
      try {
        const account = await findUserByRobloxUsername(robloxUsername);
        if (account) setAccount(account);
      } catch {
        // Permission denied or no users
      } finally {
        setLoading(false);
      }
    })();
  }, [open, robloxUsername]);

  const banIp = async () => {
    const ip = account?.last_ip || account?.data?.last_ip;
    if (!ip) return;
    setBanning(true);
    try {
      await db.entities.IpBan.create({
        ip_address: ip,
        reason: `Banned via user info modal — ${robloxUsername}`,
        banned_by: user?.email || 'Unknown',
      });
      toast({ title: 'IP banned successfully', description: `${ip} is now banned from the website.` });
    } catch {
      toast({ title: 'Failed to ban IP', variant: 'destructive' });
    } finally {
      setBanning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-white text-lg flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-cyan-400" /> {robloxUsername}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
          </div>
        ) : account ? (
          <div className="space-y-3">
            <InfoRow icon={Mail} label="Email" value={account.email || '—'} />
            <InfoRow icon={Globe} label="IP Address" value={account.last_ip || account.data?.last_ip || 'Not recorded'} />
            <InfoRow icon={Clock} label="Last Seen" value={(account.last_seen || account.data?.last_seen) ? new Date(account.last_seen || account.data.last_seen).toLocaleString() : '—'} />
            <InfoRow icon={Shield} label="Role" value={account.role || 'user'} />

            {(account.last_ip || account.data?.last_ip) && (
              <Button onClick={banIp} disabled={banning} className="w-full bg-rose-600 hover:bg-rose-500 text-white border-0 mt-2">
                {banning ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <ShieldBan className="h-4 w-4 mr-1.5" />}
                Ban IP Address
              </Button>
            )}
          </div>
        ) : (
          <div className="py-8 text-center">
            <XCircle className="h-8 w-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No website account found for this Roblox user.</p>
            <p className="text-xs text-slate-500 mt-1">This player has not registered on the portal.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2.5">
      <Icon className="h-4 w-4 text-slate-400 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-sm text-white truncate">{value}</div>
      </div>
    </div>
  );
}