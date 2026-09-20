import { useState, useEffect, useRef } from 'react';
import { Loader2, Users, Eye, Heart, ThumbsUp, Server, TrendingUp, Activity, Gamepad2, AlertCircle, Crown, Zap, Gauge, Shield, LogIn, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PLACE_ID = '103398581793479';
const POLL_INTERVAL = 30000;
const SNAPSHOT_KEY = 'game_analytics_snapshots';
const MAX_SNAPSHOTS = 2000;

function formatNum(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(Math.round(n));
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

async function fetchUniverseId(placeId) {
  const res = await fetch(`https://apis.roproxy.com/universes/v1/places/${placeId}/universe`);
  if (!res.ok) throw new Error('Failed to resolve universe');
  return (await res.json()).universeId;
}

async function fetchGameStats(universeId) {
  const res = await fetch(`https://games.roproxy.com/v1/games?universeIds=${universeId}`);
  if (!res.ok) throw new Error('Failed to fetch game stats');
  return (await res.json()).data?.[0] || null;
}

async function fetchVotes(universeId) {
  try {
    const res = await fetch(`https://games.roproxy.com/v1/games/votes?universeIds=${universeId}`);
    if (!res.ok) return null;
    return (await res.json()).data?.[0] || null;
  } catch { return null; }
}

async function fetchServers(universeId) {
  try {
    const res = await fetch(`https://games.roproxy.com/v1/games/${universeId}/servers/Public?limit=100`);
    if (!res.ok) return [];
    return (await res.json()).data || [];
  } catch { return []; }
}

async function fetchThumbnail(universeId) {
  try {
    const res = await fetch(`https://thumbnails.roproxy.com/v1/games/thumbnails?universeIds=${universeId}&size=768x432&format=Png`);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.[0]?.imageUrl || null;
  } catch { return null; }
}

function loadSnapshots() {
  try { return JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || '[]'); } catch { return []; }
}

function saveSnapshots(snaps) {
  try { localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snaps.slice(-MAX_SNAPSHOTS))); } catch {}
}

function LiveStatCard({ icon: Icon, label, value, accent }) {
  const colors = {
    cyan: 'text-cyan-300',
    rose: 'text-rose-300',
    emerald: 'text-emerald-300',
    blue: 'text-blue-300',
  };
  return (
    <div className="rounded-xl bg-white/[0.04] border border-white/10 p-3 aspect-square flex flex-col justify-between">
      <Icon className={`h-4 w-4 ${colors[accent] || colors.cyan}`} />
      <div>
        <div className="text-xl font-bold text-white leading-tight">{value}</div>
        <div className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">{label}</div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, small }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-wide mb-1">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className={`font-semibold text-white ${small ? 'text-xs truncate' : 'text-lg'}`}>{value}</div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="text-[11px] text-slate-500">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-slate-900 border border-white/15 px-3 py-2 text-xs">
      <div className="text-slate-400 mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="text-white">
          <span className="text-slate-400 capitalize">{p.dataKey}:</span> {formatNum(p.value)}
        </div>
      ))}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-[200px] flex items-center justify-center text-xs text-slate-500 text-center px-4">
      Collecting data — keep this page open or revisit regularly to build trend history.
    </div>
  );
}

export default function GameAnalytics() {
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState(null);
  const [votes, setVotes] = useState(null);
  const [servers, setServers] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [thumbnail, setThumbnail] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(false);
  const universeIdRef = useRef(null);

  const poll = async () => {
    try {
      if (!universeIdRef.current) {
        universeIdRef.current = await fetchUniverseId(PLACE_ID);
        const thumb = await fetchThumbnail(universeIdRef.current);
        if (thumb) setThumbnail(thumb);
      }
      const [gameData, voteData, serverData] = await Promise.all([
        fetchGameStats(universeIdRef.current),
        fetchVotes(universeIdRef.current),
        fetchServers(universeIdRef.current),
      ]);
      if (gameData) {
        setGame(gameData);
        setVotes(voteData);
        setServers(serverData);
        setLastUpdated(new Date());
        setError(false);
        const snap = { t: Date.now(), visits: gameData.visits || 0, playing: gameData.playing || 0, favorites: gameData.favoritedCount ?? 0 };
        setSnapshots(prev => {
          const last = prev[prev.length - 1];
          if (last && last.visits === snap.visits && last.playing === snap.playing && last.favorites === snap.favorites) return prev;
          const next = [...prev, snap];
          saveSnapshots(next);
          return next;
        });
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSnapshots(loadSnapshots());
    poll();
    const interval = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const chartData = snapshots.map(s => ({ time: formatTime(s.t), playing: s.playing, visits: s.visits, favorites: s.favorites }));
  const playingValues = snapshots.map(s => s.playing).filter(v => v > 0);
  const peakPlayers = playingValues.length ? Math.max(...playingValues) : 0;
  const minPlayers = playingValues.length ? Math.min(...playingValues) : 0;
  const avgPlayers = playingValues.length ? Math.round(playingValues.reduce((a, b) => a + b, 0) / playingValues.length) : 0;
  const visitGrowth = snapshots.length > 1 ? (snapshots[snapshots.length - 1].visits - snapshots[0].visits) : 0;
  const totalVotes = (votes?.upVotes || 0) + (votes?.downVotes || 0);
  const likePct = totalVotes > 0 ? (votes.upVotes / totalVotes) * 100 : 0;
  const likeRatioStr = totalVotes > 0 ? `${likePct.toFixed(1)}%` : '—';
  const favRatio = game?.visits > 0 ? ((game.favoritedCount / game.visits) * 100).toFixed(2) + '%' : '—';
  const totalServerPlayers = servers.reduce((s, sv) => s + (sv.playing || 0), 0);
  const avgPerServer = servers.length ? Math.round(totalServerPlayers / servers.length) : 0;
  const maxServerPlayers = servers.length ? Math.max(...servers.map(s => s.playing || 0)) : 0;
  const sortedServers = [...servers].sort((a, b) => (b.playing || 0) - (a.playing || 0)).slice(0, 8);
  const serverFill = servers.length && game?.maxPlayers ? Math.round((totalServerPlayers / (servers.length * game.maxPlayers)) * 100) + '%' : '—';

  if (loading) {
    return (
      <div className="mt-10 flex items-center justify-center py-16 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-400 mr-2" /> Loading game data…
      </div>
    );
  }

  if (error && !game) {
    return (
      <div className="mt-10 rounded-2xl bg-rose-500/5 border border-rose-500/20 p-6 text-center text-rose-300 text-sm flex items-center justify-center gap-2">
        <AlertCircle className="h-5 w-5" /> Failed to load game data. Retrying automatically…
      </div>
    );
  }

  if (!game) return null;

  return (
    <div className="mt-10">
      {/* ===== Hero Section ===== */}
      <div className="grid lg:grid-cols-5 gap-5">
        {/* Left: Info + Stats */}
        <div className="lg:col-span-3 flex flex-col">
          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 w-fit mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live on Roblox
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">{game.name || 'Escape Tsunami'}</h2>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed line-clamp-3">{game.description || 'Sprint through the chaos, outrun towering tsunamis, and climb the leaderboards.'}</p>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <a href={`https://www.roblox.com/games/${PLACE_ID}`} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-400 text-white text-sm font-medium hover:from-blue-500 hover:to-blue-300 shadow-lg shadow-blue-500/20 transition-all">
              <Play className="h-4 w-4" /> Play on Roblox
            </a>
            <Link to="/portal"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm font-medium hover:bg-white/10 transition-all">
              <LogIn className="h-4 w-4" /> Member Portal
            </Link>
          </div>

          {/* Live stats panel */}
          <div className="mt-6">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 uppercase tracking-wider mb-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Synced live from Roblox
              {lastUpdated && <span className="ml-auto normal-case tracking-normal text-slate-600">· {lastUpdated.toLocaleTimeString()}</span>}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <LiveStatCard icon={Eye} label="Total Visits" value={formatNum(game.visits || 0)} accent="cyan" />
              <LiveStatCard icon={Heart} label="Favorites" value={formatNum(game.favoritedCount || 0)} accent="rose" />
              <LiveStatCard icon={Gamepad2} label="Playing Now" value={formatNum(game.playing || 0)} accent="emerald" />
              <LiveStatCard icon={Shield} label="Status" value="Live" accent="blue" />
            </div>
          </div>
        </div>

        {/* Right: Game preview card */}
        <div className="lg:col-span-2">
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-900 aspect-[4/3] group">
            {thumbnail ? (
              <img src={thumbnail} alt={game.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-cyan-500/10 to-blue-600/10">
                <Gamepad2 className="h-12 w-12 text-slate-600" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 p-4 flex items-end justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 text-sm text-white font-medium">
                  <Users className="h-4 w-4 text-emerald-400" /> {formatNum(game.playing || 0)} playing now
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Join the community</div>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-200 backdrop-blur-sm">
                <Heart className="h-3 w-3 fill-rose-400 text-rose-400" /> {formatNum(game.favoritedCount || 0)} favorites
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Charts ===== */}
      <div className="mt-5 grid lg:grid-cols-2 gap-4">
        <ChartCard title="Live Player Count" subtitle="Real-time players online (session history)">
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gPlaying" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={30} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="playing" stroke="#10b981" strokeWidth={2} fill="url(#gPlaying)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>
        <ChartCard title="Visit Growth" subtitle="Total visits accumulated over time">
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={30} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={formatNum} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="visits" stroke="#06b6d4" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>
      </div>

      {/* ===== Community Rating ===== */}
      {votes && totalVotes > 0 && (
        <div className="mt-4 rounded-2xl bg-white/[0.03] border border-white/10 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">Community Rating</span>
            <span className="text-sm text-slate-400">
              <span className="text-emerald-400">{votes.upVotes || 0}</span> 👍 · <span className="text-rose-400">{votes.downVotes || 0}</span> 👎
            </span>
          </div>
          <div className="flex h-3 rounded-full overflow-hidden bg-rose-500/20">
            <div className="bg-emerald-500 h-full transition-all" style={{ width: `${likePct}%` }} />
          </div>
          <div className="mt-1.5 text-xs text-slate-500">{likePct.toFixed(1)}% positive · {formatNum(totalVotes)} total ratings</div>
        </div>
      )}

      {/* ===== Live Servers ===== */}
      <div className="mt-4 rounded-2xl bg-white/[0.03] border border-white/10 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Server className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Live Servers</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <MiniStat label="Active Servers" value={servers.length} />
          <MiniStat label="Players Online" value={formatNum(totalServerPlayers)} />
          <MiniStat label="Avg / Server" value={avgPerServer} />
          <MiniStat label="Max Server" value={maxServerPlayers} />
        </div>
        {sortedServers.length > 0 && (
          <div className="space-y-1.5">
            {sortedServers.map((sv, i) => {
              const pct = sv.maxPlayers ? ((sv.playing || 0) / sv.maxPlayers) * 100 : 0;
              return (
                <div key={sv.id} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-6 shrink-0">#{i + 1}</span>
                  <div className="flex-1 h-6 rounded-md bg-white/[0.03] border border-white/5 overflow-hidden relative">
                    <div className="h-full bg-gradient-to-r from-cyan-500/30 to-blue-500/30 transition-all" style={{ width: `${pct}%` }} />
                    <div className="absolute inset-0 flex items-center px-2 text-xs text-slate-300">
                      {sv.playing || 0} / {sv.maxPlayers || 0} players
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== Extended Metrics ===== */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <MetricCard icon={Crown} label="Peak Players" value={formatNum(peakPlayers)} />
        <MetricCard icon={Activity} label="Min Players" value={formatNum(minPlayers)} />
        <MetricCard icon={TrendingUp} label="Avg Players" value={formatNum(avgPlayers)} />
        <MetricCard icon={Zap} label="Visit Growth" value={`+${formatNum(visitGrowth)}`} />
        <MetricCard icon={Heart} label="Fav / Visit" value={favRatio} />
        <MetricCard icon={Users} label="Max / Server" value={game.maxPlayers || 0} />
        <MetricCard icon={Gauge} label="Server Fill" value={serverFill} />
        <MetricCard icon={ThumbsUp} label="Like Ratio" value={likeRatioStr} />
      </div>

      {snapshots.length < 2 && (
        <div className="mt-4 text-xs text-slate-500 text-center">
          Collecting trend data — keep this page open or revisit regularly to build growth history.
        </div>
      )}
    </div>
  );
}