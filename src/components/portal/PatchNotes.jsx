import { motion } from 'framer-motion';
import { Newspaper } from 'lucide-react';

const NOTES = [
  { version: 'v1.3', date: 'Aug 28, 2026', text: 'Tuned wave timing on Map A — you now get a couple extra seconds of warning before the surge hits.' },
  { version: 'v1.2', date: 'Aug 21, 2026', text: 'Fixed water physics that let players clip through the spawn wall on Map B.' },
  { version: 'v1.1', date: 'Aug 14, 2026', text: 'Added the rebirth multiplier and squashed a leaderboard desync bug.' },
];

export default function PatchNotes() {
  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-3">
        <Newspaper className="h-4 w-4 text-cyan-400" />
        <h2 className="font-semibold text-white text-sm tracking-wide uppercase">Latest Patch Notes</h2>
      </div>
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 divide-y divide-white/5">
        {NOTES.map((n, i) => (
          <motion.div
            key={n.version}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="flex items-start gap-3 p-4"
          >
            <span className="shrink-0 text-xs font-mono font-semibold text-cyan-300 mt-0.5">{n.version}</span>
            <div className="min-w-0">
              <div className="text-sm text-slate-200">{n.text}</div>
              <div className="text-xs text-slate-500 mt-0.5">{n.date}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}