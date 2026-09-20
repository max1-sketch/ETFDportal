import { Shield, Mail, User, Calendar } from 'lucide-react';

export default function SecurityCard({ user, robloxUsername }) {
  if (!user) return null;

  const rows = [
    { icon: Mail, label: 'Linked email', value: user.email || 'Not linked' },
    { icon: User, label: 'Roblox username', value: robloxUsername || 'Not verified' },
    { icon: Calendar, label: 'Member since', value: user.created_date ? new Date(user.created_date).toLocaleDateString() : '\u2014' },
  ];

  return (
    <section className="mt-10">
      <div className="flex items-center gap-2.5 mb-4">
        <Shield className="h-5 w-5 text-cyan-400" />
        <h2 className="font-display text-xl font-semibold">Account & Security</h2>
      </div>
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 space-y-3">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
              <r.icon className="h-4 w-4 text-cyan-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-500">{r.label}</div>
              <div className="text-sm text-white truncate">{r.value}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}