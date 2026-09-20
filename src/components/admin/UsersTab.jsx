const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/AuthContext';
import { logStaffAction } from '@/lib/staffLog';
import { Loader2, ShieldCheck, User as UserIcon, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function UsersTab() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('max1@staffwaitrose.net');
  const [inviteRole, setInviteRole] = useState('admin');
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      setUsers((await db.entities.User.list(100)) || []);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const invite = async () => {
    const email = inviteEmail.trim();
    if (!email) return;
    setInviting(true);
    setInviteMsg(null);
    try {
      await db.users.inviteUser(email, inviteRole);
      await logStaffAction(user, 'user_role_changed', email, `Invited ${email} as ${inviteRole}`);
      setInviteMsg({ type: 'success', text: `Invitation sent to ${email}.` });
      setInviteEmail('');
      await load();
    } catch (err) {
      setInviteMsg({ type: 'error', text: err.message || 'Invitation failed.' });
    } finally {
      setInviting(false);
    }
  };

  const setRole = async (u, role) => {
    setSavingId(u.id);
    try {
      await db.entities.User.update(u.id, { role });
      const handle = u.full_name || u.email.split('@')[0];
    await logStaffAction(user, 'user_role_changed', handle, `Set ${handle} to ${role}`);
      await load();
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-16 text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div>
      <p className="text-sm text-slate-400 mb-3">Grant admin access so teammates can use this dashboard.</p>

      {/* Invite staff — only visible to max1@staffwaitrose.net */}
      {user?.email === 'max1@staffwaitrose.net' && (
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <UserPlus className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Invite a staff member</h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="staff@example.com"
            className="bg-slate-950/60 border-white/15 text-white flex-1"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="h-9 rounded-md border border-white/15 bg-slate-950/60 px-2 text-sm text-white"
          >
            <option value="user">Member</option>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
          <Button
            onClick={invite}
            disabled={inviting || !inviteEmail.trim()}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-0"
          >
            {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Invite
          </Button>
        </div>
        {inviteMsg && (
          <div className={`mt-2 text-xs ${inviteMsg.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
            {inviteMsg.text}
          </div>
        )}
      </div>
      )}

      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] border border-white/10 px-4 py-3">
            <div className="min-w-0">
              <div className="text-sm text-white truncate">{u.full_name || u.email.split('@')[0]}</div>
              <div className="text-xs text-slate-500 truncate">@{u.email.split('@')[0]}</div>
            </div>
            <div className="flex items-center gap-2">
              {u.role === 'admin' ? (
                <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                  <ShieldCheck className="h-3.5 w-3.5" /> Admin
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400">
                  <UserIcon className="h-3.5 w-3.5" /> Member
                </span>
              )}
              <select
                value={u.role || 'user'}
                disabled={savingId === u.id}
                onChange={(e) => setRole(u, e.target.value)}
                className="h-9 rounded-md border border-white/15 bg-slate-950/60 px-2 text-sm text-white"
              >
                <option value="user">user</option>
                <option value="staff">staff</option>
                <option value="admin">admin</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}