const db = globalThis.__B44_DB__ || { 
  auth: { isAuthenticated: async () => false, me: async () => null }, 
  entities: new Proxy({}, { 
    get: () => ({ 
      list: async () => [], // <--- ADDED list() HERE TO PREVENT CRASH
      filter: async () => [], 
      get: async () => null, 
      create: async () => ({}), 
      update: async () => ({}), 
      delete: async () => ({}) 
    }) 
  }), 
  integrations: { Core: { UploadFile: async () => ({ file_url: '' }) } } 
};

import React, { useState, useEffect } from 'react';
import { ShieldBan } from 'lucide-react';
import {
  generateFingerprint,
  setBanToken,
  hasBanToken,
  hasBanTokenIDB,
  clearBanToken,
  addBannedFingerprint,
  isFingerprintBanned,
  checkRateLimit,
  validateClient,
  checkIpIntelligence,
  solveChallenge,
} from '@/lib/banEvasion';
import { useAuth } from '@/lib/AuthContext';

export default function IpBanCheck({ children }) {
  const [status, setStatus] = useState('checking');
  const { user, isLoadingAuth } = useAuth();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Bypass IP ban logic completely in local development or preview environments
      if (import.meta.env.DEV) {
        clearBanToken();
        if (!cancelled) setStatus('ok');
        return;
      }

      // 1. User-Agent / client validation — block scripts & headless browsers
      if (!validateClient()) {
        if (!cancelled) setStatus('banned');
        return;
      }

      // 2. Check server-side IP ban first (authoritative source of truth)
      let ip = null;
      let serverBanned = false;
      let serverChecked = false;
      try {
        const [ipRes, bans] = await Promise.all([
          fetch('https://api.ipify.org?format=json').then((r) => r.json()),
          db.entities?.IpBan?.list ? db.entities.IpBan.list() : Promise.resolve([]),
        ]);
        if (cancelled) return;
        ip = ipRes.ip;
        serverBanned = Array.isArray(bans) && bans.some((b) => b.ip_address === ip);
        serverChecked = true;
      } catch {
        // Server unreachable — fail open for the initial check
      }

      // 3. Server confirms ban — persist tokens and block
      if (serverBanned) {
        const fp = await generateFingerprint();
        setBanToken(fp);
        addBannedFingerprint(fp);
        if (!cancelled) setStatus('banned');
        return;
      }

      // 4. Server says NOT banned — clear any stale client-side ban tokens/fingerprints
      if (serverChecked) {
        const hasToken = hasBanToken() || await hasBanTokenIDB();
        const fp = await generateFingerprint();
        if (hasToken || isFingerprintBanned(fp)) {
          clearBanToken();
        }
      } else if (hasBanToken() || await hasBanTokenIDB()) {
        if (!cancelled) setStatus('banned');
        return;
      } else {
        const fp = await generateFingerprint();
        if (isFingerprintBanned(fp)) {
          if (!cancelled) setStatus('banned');
          return;
        }
      }

      // 5. Rate limiting — stop automated ban evasion / brute-force
      if (!checkRateLimit()) {
        if (!cancelled) setStatus('banned');
        return;
      }

      // 6. IP intelligence — VPN / proxy / hosting / known ASN
      if (serverChecked && ip) {
        try {
          const intel = await checkIpIntelligence(ip);
          if (intel.threat) {
            const solved = await solveChallenge();
            if (!solved) {
              if (!cancelled) setStatus('banned');
              return;
            }
          }
        } catch {
          // Fail open
        }
      }

      if (!cancelled) setStatus('ok');
    })();
    return () => { cancelled = true; };
  }, []);

  // Account-linked ban — block banned users even on a new IP or alternate account
  useEffect(() => {
    if (!isLoadingAuth && user?.data?.banned) {
      setStatus('banned');
    }
  }, [user, isLoadingAuth]);

  // Record the user's IP and last_seen
  useEffect(() => {
    if (isLoadingAuth || !user) return;
    (async () => {
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json').then((r) => r.json());
        if (db.auth?.updateMe) {
          await db.auth.updateMe({
            last_ip: ipRes.ip,
            last_seen: new Date().toISOString(),
          });
        }
      } catch {
        // Non-critical — fail silently
      }
    })();
  }, [user, isLoadingAuth]);

  if (status === 'banned') {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-950 flex items-center justify-center p-6 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-rose-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500/40 to-transparent" />

        <div className="relative max-w-lg w-full text-center">
          <div className="relative mx-auto mb-8 w-fit">
            <div className="absolute inset-0 rounded-3xl bg-rose-500/20 blur-xl animate-pulse-slow" />
            <div className="relative h-20 w-20 rounded-3xl bg-gradient-to-br from-rose-500/15 to-rose-900/20 border border-rose-500/30 flex items-center justify-center shadow-lg shadow-rose-500/10">
              <ShieldBan className="h-9 w-9 text-rose-400" />
            </div>
          </div>

          <h1 className="font-display text-3xl font-bold text-white mb-3 tracking-tight">Access Denied</h1>
          <p className="text-slate-400 leading-relaxed mb-8 max-w-sm mx-auto">
            Your IP address has been banned from this website. If you believe this is an error, please contact support.
          </p>

          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 text-left">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-400/80 mb-3">Need help?</div>
            <a
              href="https://discord.gg/escapetsunami"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 hover:bg-white/[0.07] transition-colors group"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/15 border border-indigo-500/25 shrink-0">
                <svg className="h-4.5 w-4.5 text-indigo-400" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-white">Join our Discord</div>
                <div className="text-xs text-slate-500">Open a support ticket to appeal your ban</div>
              </div>
              <svg className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
            </a>
          </div>

          <p className="text-xs text-slate-600 mt-6">Escape Tsunami · For Developers</p>
        </div>
      </div>
    );
  }

  return children;
}