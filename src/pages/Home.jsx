import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Waves, Users, Heart, Gamepad2, ArrowRight, LogIn, Trophy,
  Zap, Footprints, RefreshCw, Building2, ShieldCheck, Loader2,
  Snowflake, Play, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import SiteNav from '@/components/SiteNav';
import { useGameStats } from '@/hooks/useGameStats';

const GAME = {
  name: 'Escape Tsunami For Developers',
  icon: 'https://tr.rbxcdn.com/180DAY-acc19bee7d79dc93900a4b042adad2e3/256/256/Image/Png/noFilter',
  url: 'https://www.roblox.com/games/103398581793479/Escape-Tsunami-For-Developers',
  group: 'https://www.roblox.com/communities/33513762',
  creator: 'Waitrose Shopping',
};

const features = [
  { icon: Footprints, title: 'Outrun the Wave', text: 'Grab your favorite Developers and bolt for high ground before the tsunami rolls in.', featured: true },
  { icon: Waves, title: 'Read the Water', text: 'Tower-high waves sweep the arena with seconds of warning.' },
  { icon: Zap, title: 'Build Your Empire', text: 'Stack speed and power up your Developers so the cash piles up faster every round.' },
  { icon: RefreshCw, title: 'Break the Limit', text: 'Rebirth to wipe the slate and come back stronger with a permanent boost.' },
  { icon: Building2, title: 'Grow Your Roster', text: 'Unlock extra slots and run more Developers at once — earning even while offline.' },
  { icon: Trophy, title: 'Claim the Crown', text: 'Out-survive the whole server and etch your name at the top of the leaderboard.', wide: true },
];

const steps = [
  { num: '01', title: 'Join the Game', text: 'Hop into Escape Tsunami on Roblox and spawn into the arena.' },
  { num: '02', title: 'Collect Developers', text: 'Grab your favorite Developers and assign them to earn while you play.' },
  { num: '03', title: 'Outrun the Wave', text: 'Watch the water, read the signs, and sprint to high ground before the tsunami hits.' },
  { num: '04', title: 'Rebirth & Climb', text: 'Reset for permanent boosts and dominate the leaderboard.' },
];

const fade = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.08, ease: 'easeOut' } }),
};

export default function Home() {
  const { stats: live, loading: statsLoading } = useGameStats();

  const fmt = (n) => {
    if (n == null) return '—';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return n.toLocaleString();
  };

  const stats = [
    { icon: Users, label: 'Total Visits', value: statsLoading ? '—' : fmt(live?.visits) },
    { icon: Heart, label: 'Favorites', value: statsLoading ? '—' : fmt(live?.favorites) },
    { icon: Gamepad2, label: 'Playing Now', value: statsLoading ? '—' : (live?.playing ?? 0) },
    { icon: ShieldCheck, label: 'Status', value: 'Live' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      <SiteNav />

      {/* ===== Hero ===== */}
      <section className="relative pt-32 pb-16 px-5">
        <div className="winter-only winter-badge absolute top-24 right-8 z-20 items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-cyan-500/20 text-cyan-300 text-sm font-medium backdrop-blur-sm">
          <Snowflake className="h-4 w-4 snowflake-spin" /> Winter Edition
        </div>
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 winter-hero-image bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?ixlib=rb-4.0.3&w=1600&q=80)' }} />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/50 to-slate-950" />
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-cyan-500/20 blur-[140px]" />
          <div className="absolute top-20 right-0 h-[400px] w-[400px] rounded-full bg-blue-600/20 blur-[120px]" />
          <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        </div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          <div>
            <motion.div variants={fade} initial="hidden" animate="show" className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-cyan-300 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
              </span>
              Live on Roblox
            </motion.div>

            <motion.h1 variants={fade} custom={1} initial="hidden" animate="show" className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.02]">
              Escape <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 bg-clip-text text-transparent">Tsunami</span>
              <span className="block text-white/90 text-3xl sm:text-4xl lg:text-5xl mt-2 font-semibold">For Developers</span>
            </motion.h1>

            <motion.p variants={fade} custom={2} initial="hidden" animate="show" className="mt-6 text-lg text-slate-200 max-w-xl leading-[1.6]">
              Sprint through the chaos, collect your favorite Developers, and outrun towering tsunamis. Upgrade, rebirth, and climb the leaderboards — your Developers keep earning even while you are offline.
            </motion.p>

            <motion.div variants={fade} custom={3} initial="hidden" animate="show" className="mt-8 flex flex-wrap gap-4">
              <a href={GAME.url} target="_blank" rel="noreferrer">
                <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-0 h-12 px-7 text-base shadow-lg shadow-cyan-500/25">
                  <Play className="h-5 w-5 mr-2" /> Play on Roblox
                </Button>
              </a>
              <Link to="/portal">
                <Button size="lg" variant="outline" className="h-12 px-7 text-base bg-white/5 border-white/15 text-white hover:bg-white/10 hover:text-white">
                  <LogIn className="h-5 w-5 mr-2" /> Member Portal
                </Button>
              </Link>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }} className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-6 bg-gradient-to-br from-cyan-500/40 to-blue-600/40 rounded-[2.5rem] blur-3xl" />
            <div className="relative rounded-[2rem] overflow-hidden border border-white/15 shadow-2xl shadow-cyan-900/40 bg-slate-900">
              <div className="relative aspect-square">
                <Image src={GAME.icon} alt={GAME.name} fittingType="fill" className="w-full h-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-5">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-cyan-300" />
                    <div>
                      <div className="text-lg font-semibold text-white">{statsLoading ? '…' : `${fmt(live?.playing ?? 0)} playing now`}</div>
                      <div className="text-xs text-cyan-300/80 font-medium tracking-wide uppercase">Join the community</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-3 -right-3 rounded-2xl bg-slate-900 border border-white/10 px-4 py-2.5 shadow-xl">
              <div className="flex items-center gap-2 text-sm">
                {statsLoading ? <Loader2 className="h-4 w-4 text-rose-400 animate-spin" /> : <Heart className="h-4 w-4 text-rose-400 fill-rose-400" />}
                <span className="font-semibold text-white">{statsLoading ? '…' : fmt(live?.favorites ?? 0)}</span>
                <span className="text-slate-400">favorites</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== Live Stats Bar ===== */}
      <section className="px-5 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-3 text-[11px] font-medium uppercase tracking-wider text-cyan-400/80">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400" />
            </span>
            Synced live from Roblox
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="group rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-4 backdrop-blur-sm hover:bg-white/[0.07] hover:border-cyan-500/30 transition-all duration-300">
                <s.icon className="h-4 w-4 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-xl font-semibold text-white">{s.value}</div>
                <div className="text-[11px] uppercase tracking-wider text-slate-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== How to Play ===== */}
      <section className="px-5 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-semibold tracking-[0.2em] uppercase text-cyan-300 mb-4">Getting Started</div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">How to play</h2>
            <p className="mt-4 text-slate-400">Four steps from spawn to leaderboard.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((s, i) => (
              <motion.div key={s.num} variants={fade} custom={i} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} className="relative rounded-2xl bg-white/[0.04] border border-white/10 p-5 hover:border-cyan-500/30 transition-all duration-300">
                <div className="text-3xl font-bold bg-gradient-to-br from-cyan-400 to-blue-500 bg-clip-text text-transparent">{s.num}</div>
                <h3 className="mt-3 font-semibold text-white">{s.title}</h3>
                <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">{s.text}</p>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-2.5 h-px w-5 bg-gradient-to-r from-cyan-500/40 to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Features (Bento) ===== */}
      <section className="px-5 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-semibold tracking-[0.2em] uppercase text-cyan-300 mb-4">How it plays</div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Survive, collect, and rise</h2>
            <p className="mt-4 text-slate-400">Everything you can do in-game, in one quick look.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fade} custom={i} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}
                className={`group relative rounded-2xl bg-white/[0.05] border border-white/15 p-6 shadow-lg shadow-cyan-950/40 hover:border-cyan-500/40 hover:bg-white/[0.07] hover:shadow-cyan-500/10 hover:-translate-y-1 transition-all duration-300 overflow-hidden ${
                  f.featured ? 'lg:col-span-2 bg-gradient-to-br from-cyan-500/[0.08] to-blue-600/[0.08]' : ''
                } ${f.wide ? 'lg:col-span-3' : ''}`}
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-start gap-4">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:shadow-cyan-500/20 group-hover:shadow-lg transition-transform">
                    <f.icon className="h-5 w-5 text-cyan-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg">{f.title}</h3>
                    <p className="mt-2 text-sm text-slate-400 leading-relaxed">{f.text}</p>
                  </div>
                </div>
                {f.featured && (
                  <div className="absolute bottom-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity">
                    <Sparkles className="h-16 w-16 text-cyan-400" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Member Portal CTA ===== */}
      <section className="px-5 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 p-8 sm:p-14 shadow-2xl shadow-cyan-950/50">
            <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-cyan-500/20 blur-[100px]" />
            <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-blue-600/20 blur-[100px]" />
            <div className="relative text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-medium text-cyan-300 mb-5">
                <ShieldCheck className="h-3.5 w-3.5" /> Members Only
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Got moderated in-game?</h2>
              <p className="mt-4 text-slate-300 leading-relaxed max-w-xl mx-auto">
                The Member Portal lets you review every recent moderation action taken on your account and submit an appeal directly to the staff team — all in one place.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm text-slate-300">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10"><span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> View warnings, mutes & bans</span>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10"><span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> Submit appeals</span>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10"><span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> Track status in real time</span>
              </div>
              <div className="mt-8">
                <Link to="/portal">
                  <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-0 h-12 px-7 text-base shadow-lg shadow-cyan-500/25">
                    Enter the Portal <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-white/10 px-5 py-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Waves className="h-4 w-4 text-cyan-400" />
            Escape Tsunami For Developers · fan & community hub
          </div>
          <div className="flex items-center gap-5 text-sm text-slate-400">
            <a href={GAME.url} target="_blank" rel="noreferrer" className="hover:text-cyan-300 transition-colors">Roblox ↗</a>
            <a href={GAME.group} target="_blank" rel="noreferrer" className="hover:text-cyan-300 transition-colors">Group ↗</a>
          </div>
        </div>
      </footer>
    </div>
  );
}