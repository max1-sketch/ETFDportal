const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useRef } from 'react';

import { useAuth } from '@/lib/AuthContext';

/**
 * Fires native OS notifications for new portal notifications — but ONLY
 * when the app is running as an installed desktop application. In a regular
 * browser tab this component does nothing.
 *
 * Polls the Notification entity every 20 seconds for the logged-in user's
 * verified Roblox username and shows a system notification for any new ones.
 */
export default function DesktopNotifications({ isDesktopApp }) {
  const { user } = useAuth();
  const seenIds = useRef(new Set());
  const usernameRef = useRef(null);

  useEffect(() => {
    if (!isDesktopApp) return;
    if (!('Notification' in window)) return;

    // Request permission once, silently if already granted/denied
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, [isDesktopApp]);

  useEffect(() => {
    if (!isDesktopApp || !user?.roblox_username) return;
    usernameRef.current = user.roblox_username;

    let active = true;

    const poll = async () => {
      if (!active || Notification.permission !== 'granted') return;
      try {
        const notes = await db.entities.Notification.filter(
          { roblox_username: usernameRef.current },
          '-created_date',
          10
        );
        if (!active || !Array.isArray(notes)) return;

        for (const n of notes) {
          if (seenIds.current.has(n.id)) continue;
          seenIds.current.add(n.id);

          // Don't fire for notifications that existed before the app opened
          const age = Date.now() - new Date(n.created_date).getTime();
          if (age < 60_000) {
            new Notification(n.title || 'Escape Tsunami', {
              body: n.body || '',
              icon: 'https://db.com/logo_v2.svg',
              tag: n.id,
            });
          }
        }
      } catch {
        // silent — polling will retry
      }
    };

    poll();
    const interval = setInterval(poll, 20_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isDesktopApp, user?.roblox_username]);

  return null;
}