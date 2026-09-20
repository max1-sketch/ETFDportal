import { motion } from 'framer-motion';
import { Terminal, Sparkles, Waves, Code2, BadgeCheck } from 'lucide-react';

const UPCOMING = [
  {
    icon: Waves,
    title: 'Tsunami Sandbox Mode',
    desc: 'Test your builds against configurable wave heights without losing progress. Perfect for stress-testing bases before the real thing hits.',
    tag: 'In testing',
  },
  {
    icon: Code2,
    title: 'Lua Script Inspector',
    desc: 'Live-view the Lua behind in-game objects. A learning tool for devs who want to see exactly how the mechanics tick under the hood.',
    tag: 'Coming soon',
  },
  {
    icon: Sparkles,
    title: 'Custom Wave Editor',
    desc: 'Design and share your own tsunami patterns with the community. Top-rated waves get featured in the main rotation.',
    tag: 'Design phase',
  },
  {
    icon: BadgeCheck,
    title: 'Dev Badge Pack 2',
    desc: 'A new set of collectible badges for surviving dev-only challenge waves. Hunt them all to unlock a special portal flair.',
    tag: 'Next drop',
  },
];

export default function DevSandbox() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="mt-10"
    >
      <div className="rounded-2xl bg-gradient-to-br from-cyan-500/10 via-blue-600/5 to-transparent border border-cyan-500/20 p-6">
        <div className="flex items-center gap-2.5">
          <span className="h-9 w-9 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
            <Terminal className="h-5 w-5 text-cyan-300" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold text-white">Dev Sandbox</h2>
            <p className="text-xs text-cyan-300/80">Exclusive to players in good standing — a peek at what we're building next.</p>
          </div>
        </div>

        <div className="mt-5 grid sm:grid-cols-2 gap-3">
          {UPCOMING.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.06 }}
              className="rounded-xl bg-slate-950/40 border border-white/10 p-4 hover:border-cyan-500/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                  <f.icon className="h-4 w-4 text-cyan-300" />
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  {f.tag}
                </span>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-white">{f.title}</h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}