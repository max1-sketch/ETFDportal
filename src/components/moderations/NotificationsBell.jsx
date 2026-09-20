import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotificationsBell({ notifications = [], onMarkAllRead }) {
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) onMarkAllRead?.();
  };

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="ghost"
        onClick={toggle}
        className="relative text-slate-300 hover:text-white hover:bg-white/10"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto rounded-2xl bg-slate-900 border border-white/10 shadow-2xl z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 sticky top-0 bg-slate-900">
              <span className="text-sm font-semibold text-white">Notifications</span>
              <span className="text-xs text-slate-500">{notifications.length} total</span>
            </div>
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-slate-500">You're all caught up 🎉</div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.map((n) => (
                  <div key={n.id} className={`px-4 py-3 ${n.read ? '' : 'bg-cyan-500/[0.06]'}`}>
                    <div className="flex items-center gap-2">
                      {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0" />}
                      <div className="text-sm font-medium text-white">{n.title}</div>
                    </div>
                    {n.body && <div className="text-xs text-slate-400 mt-1">{n.body}</div>}
                    <div className="text-[10px] text-slate-600 mt-1.5">{new Date(n.created_date).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}