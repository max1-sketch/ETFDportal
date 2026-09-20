import { useEffect, useState } from 'react';

/**
 * Detects whether the app is running as an installed desktop/PWA app
 * (standalone display mode) rather than in a regular browser tab.
 * Initializes synchronously to avoid a flash of the wrong layout.
 */
export function useDesktopApp() {
  const [isDesktopApp, setIsDesktopApp] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia?.('(display-mode: standalone)')?.matches ||
      window.matchMedia?.('(display-mode: window-controls-overlay)')?.matches ||
      window.matchMedia?.('(display-mode: minimal-ui)')?.matches ||
      window.navigator?.standalone === true
    );
  });

  useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)');
    const handler = (e) => setIsDesktopApp(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  return isDesktopApp;
}