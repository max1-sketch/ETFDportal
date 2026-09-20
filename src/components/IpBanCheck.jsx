import React, { useState, useEffect } from 'react';
import { ShieldBan } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

// Safe unified DB fallback
const getDb = () => {
  if (globalThis.__B44_DB__) return globalThis.__B44_DB__;
  return {
    auth: {
      isAuthenticated: async () => false,
      me: async () => null,
      updateMe: async () => ({}),
    },
    entities: new Proxy({}, {
      get: () => ({
        list: async () => [],
        filter: async () => [],
        get: async () => null,
        create: async () => ({}),
        update: async () => ({}),
        delete: async () => ({}),
      }),
    }),
  };
};

export default function IpBanCheck({ children }) {
  const [status, setStatus] = useState('checking');
  const { user, isLoadingAuth } = useAuth();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Always pass through in development
      if (import.meta.env.DEV) {
        if (!cancelled) setStatus('ok');
        return;
      }

      const db = getDb();

      try {
        const [ipRes, bans] = await Promise.all([
          fetch('https://api.ipify.org?format=json').then((r) => r.json()).catch(() => ({ ip: null })),
          db.entities.IpBan ? db.entities.IpBan.list().catch(() => []) : Promise.resolve([]),
        ]);

        if (cancelled) return;

        if (ipRes.ip && Array.isArray(bans) && bans.some((b) => b.ip_address === ipRes.ip)) {
          setStatus('banned');
          return;
        }
      } catch {
        // Fail open if backend/mock is unreachable
      }

      if (!cancelled) setStatus('ok');
    })();

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isLoadingAuth && user?.data?.banned) {
      setStatus('banned');
    }
  }, [user, isLoadingAuth]);

  if (status === 'banned') {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-950 flex items-center justify-center p-6 overflow-hidden">
        <div className="relative max-w-lg w-full text-center">
          <div className="relative mx-auto mb-8 w-fit">
            <div className="relative h-20 w-20 rounded-3xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shadow-lg shadow-rose-500/10">
              <ShieldBan className="h-9 w-9 text-rose-400" />
            </div>
          </div>
          <h1 className="font-display text-3xl font-bold text-white mb-3 tracking-tight">Access Denied</h1>
          <p className="text-slate-400 leading-relaxed mb-8 max-w-sm mx-auto">
            Your IP address has been banned from this website.
          </p>
        </div>
      </div>
    );
  }

  return children;
}