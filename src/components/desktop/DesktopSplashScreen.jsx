import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Waves } from 'lucide-react';

/**
 * Branded splash screen shown only when the app launches as an installed
 * desktop application. Stays visible until the app is ready, with a
 * minimum branding display time of 1.2s.
 */
export default function DesktopSplashScreen({ ready = true }) {
  const [visible, setVisible] = useState(true);
  const [minElapsed, setMinElapsed] = useState(false);

  // Minimum display time for branding
  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), 1200);
    return () => clearTimeout(t);
  }, []);

  // Hide when app is ready AND minimum time has passed
  useEffect(() => {
    if (ready && minElapsed) {
      setVisible(false);
    }
  }, [ready, minElapsed]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950"
        >
          {/* glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-cyan-500/15 blur-[140px]" />

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="relative flex flex-col items-center"
          >
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-cyan-500/30 mb-6">
              <Waves className="h-10 w-10 text-white" />
            </div>

            <h1 className="font-display text-3xl font-bold tracking-tight text-white text-center">
              Escape <span className="bg-gradient-to-r from-cyan-300 to-blue-500 bg-clip-text text-transparent">Tsunami</span>
            </h1>
            <p className="mt-1.5 text-sm text-slate-400 tracking-wide uppercase">Member Portal</p>

            {/* loading bar */}
            <div className="mt-8 h-1 w-48 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                className="h-full w-1/2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
              />
            </div>
          </motion.div>

          <p className="absolute bottom-8 text-xs text-slate-600">Tsunami Shield · Desktop Edition</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}