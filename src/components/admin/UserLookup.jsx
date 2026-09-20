const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState, useRef } from 'react';

import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Search, User as UserIcon, Bot, Shield, Calendar, FileText, Users, Gavel, Clock, AlertTriangle, MessageSquare, RefreshCw, Info, Mail, Globe, ShieldBan } from 'lucide-react';
import UserLookupAppeals from '@/components/admin/UserLookupAppeals';
import { useToast } from '@/components/ui/use-toast';
import { findUserByRobloxUsername } from '@/lib/userLookup';

const ROBLOX_USERS_HOSTS = [
  'https://users.roproxy.com/v1',
  'https://users.rproxy.app/v1',
];
const ROBLOX_THUMBS_HOSTS = [
  'https://thumbnails.roproxy.com/v1',
  'https://thumbnails.rproxy.app/v1',
];
const ROBLOX_GROUPS_HOSTS = [
  'https://groups.roproxy.com/v1',
  'https://groups.rproxy.app/v1',
];

async function fetchWithFallback(hosts, path, init) {
  for (const host of hosts) {
    try {
      const res = await fetch(`${host}${path}`, init);
      if (res.ok) return await res.json();
    } catch {}
  }
  return null;
}

const MOD_TYPE_STYLES = {
  'Warning': 'text-amber-300 bg-amber-500/10 border-amber-500/20',
  'Mute': 'text-slate-300 bg-slate-500/10 border-slate-500/20',
  'Kick': 'text-orange-300 bg-orange-500/10 border-orange-500/20',
  'Temporary Ban': 'text-rose-300 bg-rose-500/10 border-rose-500/20',
  'Permanent Ban': 'text-red-400 bg-red-500/15 border-red-500/30',
};

const DISCORD_ACTION_STYLES = {
  timeout: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
  untimeout: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  kick: 'text-orange-300 bg-orange-500/10 border-orange-500/20',
  ban: 'text-rose-300 bg-rose-500/10 border-rose-500/20',
  unban: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  lookup: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/20',
};

function accountAge(createdDate) {
  if (!createdDate) return '—';
  const diff = Date.now() - new Date(createdDate).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 365) return `${days} day${days !== 1 ? 's' : ''}`;
  const years = Math.floor(days / 365);
  const remDays = days % 365;
  return `${years} year${years !== 1 ? 's' : ''}, ${remDays} day${remDays !== 1 ? 's' : ''}`;
}

export default function UserLookup() {
  const { user } = useAuth();
  const [platform, setPlatform] = useState('roblox');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [robloxProfile, setRobloxProfile] = useState(null);
  const [discordData, setDiscordData] = useState(null);
  const [fetchingProfile, setFetchingProfile] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const search = async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setRobloxProfile(null);
    setDiscordData(null);
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }

    try {
      if (platform === 'roblox') {
        await searchRoblox(q);
      } else {
        await searchDiscord(q);
      }
    } catch (err) {
      setError(err.message || 'Lookup failed');
    } finally {
      setLoading(false);
    }
  };

  const searchRoblox = async (username) => {
    // Try multiple Roblox API proxies — if one is down, the next is used
    let userData = null;
    let proxyResponded = false;
    for (const host of ROBLOX_USERS_HOSTS) {
      try {
        const userRes = await fetch(`${host}/usernames/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
        });
        if (!userRes.ok) continue;
        proxyResponded = true;
        userData = (await userRes.json()).data?.[0];
        break;
      } catch {}
    }
    if (!proxyResponded) throw new Error('Roblox user lookup failed — all proxies unavailable, try again in a moment');
    if (!userData) throw new Error(`No Roblox user found with username "${username}"`);
    const userId = userData.id;

    const [headData, bodyData, groupsData] = await Promise.all([
      fetchWithFallback(ROBLOX_THUMBS_HOSTS, `/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`),
      fetchWithFallback(ROBLOX_THUMBS_HOSTS, `/users/avatar?userIds=${userId}&size=420x420&format=Png&isCircular=false`),
      fetchWithFallback(ROBLOX_GROUPS_HOSTS, `/users/${userId}/groups/roles`),
    ]);

    let moderations = [];
    let appeals = [];
    let websiteAccount = null;
    try {
      [moderations, appeals] = await Promise.all([
        db.entities.Moderation.filter({ roblox_username: userData.name }, '-moderation_date', 50),
        db.entities.Appeal.filter({ roblox_username: userData.name }, '-created_date', 50),
      ]);
    } catch { /* RLS */ }
    websiteAccount = await findUserByRobloxUsername(userData.name);

    setRobloxProfile({
      userId,
      username: userData.name,
      displayName: userData.displayName,
      description: userData.description,
      createdDate: userData.created,
      isBanned: userData.isBanned,
      headshot: headData?.data?.[0]?.imageUrl,
      fullBody: bodyData?.data?.[0]?.imageUrl,
      groups: (groupsData?.data || []).map((g) => ({
        name: g.group?.name,
        id: g.group?.id,
        memberCount: g.group?.memberCount,
        role: g.role?.name,
        rank: g.role?.rank,
      })),
      moderations,
      appeals,
      websiteAccount,
    });
  };

  const searchDiscord = async (rawId) => {
    const discordId = rawId.replace(/[^0-9]/g, '');
    if (!discordId) throw new Error('Enter a valid Discord user ID (numbers only)');

    let actions = [];
    try {
      actions = await db.entities.DiscordAction.filter(
        { discord_user_id: discordId },
        '-created_date',
        50
      );
    } catch { /* ignore */ }

    const profileAction = actions.find((a) => a.avatar_url || a.profile_fetched_at);

    setDiscordData({
      discordId,
      username: profileAction?.discord_username || actions.find((a) => a.discord_username)?.discord_username || discordId,
      actions,
      avatarUrl: profileAction?.avatar_url || `https://cdn.discordapp.com/embed/avatars/${Number(BigInt(discordId) % 6n)}.png`,
      displayName: profileAction?.display_name || null,
      accentColor: profileAction?.accent_color || null,
      bannerUrl: profileAction?.banner_url || null,
      bio: profileAction?.bio || null,
      accountCreated: profileAction?.account_created || null,
      hasProfile: !!profileAction?.avatar_url,
      hasHistory: actions.some((a) => a.action_type !== 'lookup'),
    });
  };

  const fetchDiscordProfile = async () => {
    if (!discordData) return;
    setFetchingProfile(true);
    try {
      await db.entities.DiscordAction.create({
        discord_user_id: discordData.discordId,
        discord_username: discordData.username !== discordData.discordId ? discordData.username : '',
        action_type: 'lookup',
        reason: 'Profile lookup from admin dashboard',
        status: 'pending',
        issued_by: user?.full_name || user?.email || 'Unknown staff',
      });
      // Poll for the bot to cache the profile
      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts++;
        try {
          const actions = await db.entities.DiscordAction.filter(
            { discord_user_id: discordData.discordId },
            '-created_date',
            50
          );
          // Check for cached profile data
          const profileAction = actions.find((a) => a.avatar_url || a.profile_fetched_at);
          if (profileAction) {
            if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
            setFetchingProfile(false);
            setDiscordData((prev) => ({
              ...prev,
              actions,
              avatarUrl: profileAction.avatar_url,
              displayName: profileAction.display_name,
              accentColor: profileAction.accent_color,
              bannerUrl: profileAction.banner_url,
              bio: profileAction.bio,
              accountCreated: profileAction.account_created,
              hasProfile: true,
              username: profileAction.discord_username || prev.username,
            }));
            return;
          }
          // Also check if the latest lookup action completed/failed without profile data
          const latestLookup = actions.find((a) => a.action_type === 'lookup');
          if (latestLookup && (latestLookup.status === 'completed' || latestLookup.status === 'failed')) {
            if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
            setFetchingProfile(false);
            setDiscordData((prev) => ({ ...prev, actions }));
            if (latestLookup.status === 'failed') {
              setError(`Bot failed to fetch profile: ${latestLookup.result_message || 'unknown error'}`);
            } else {
              setError('Bot completed the lookup but returned no profile data. Make sure your bot is running the latest poller version.');
            }
          }
        } catch { /* keep polling */ }
        if (attempts >= 10) {
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
          setFetchingProfile(false);
          setError('Profile fetch timed out — make sure your Discord bot is running the updated poller and connected to the portal.');
        }
      }, 3000);
    } catch (err) {
      setError('Failed to queue profile fetch: ' + (err.message || 'unknown error'));
      setFetchingProfile(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => { setPlatform('roblox'); setRobloxProfile(null); setDiscordData(null); setError(null); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            platform === 'roblox'
              ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
              : 'bg-slate-950/60 border-white/15 text-slate-400 hover:text-white'
          }`}
        >
          <UserIcon className="h-4 w-4 inline mr-1.5" /> Roblox
        </button>
        <button
          type="button"
          onClick={() => { setPlatform('discord'); setRobloxProfile(null); setDiscordData(null); setError(null); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            platform === 'discord'
              ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
              : 'bg-slate-950/60 border-white/15 text-slate-400 hover:text-white'
          }`}
        >
          <Bot className="h-4 w-4 inline mr-1.5" /> Discord
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder={platform === 'roblox' ? 'Enter Roblox username…' : 'Enter Discord user ID…'}
            className="bg-slate-950/60 border-white/15 text-white pl-9"
          />
        </div>
        <Button
          onClick={search}
          disabled={loading || !query.trim()}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-0"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Lookup
        </Button>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-rose-300 mb-4 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-20 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {platform === 'roblox' && robloxProfile && <RobloxResult profile={robloxProfile} onReload={search} />}
      {platform === 'discord' && discordData && (
        <DiscordResult
          data={discordData}
          onFetchProfile={fetchDiscordProfile}
          fetching={fetchingProfile}
        />
      )}

      {!loading && !robloxProfile && !discordData && !error && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 py-20 text-center text-slate-500">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {platform === 'roblox'
              ? 'Search a Roblox username to view their full profile, account age, groups, and moderation history.'
              : 'Enter a Discord user ID to view their profile and moderation history. Click "Fetch Profile" to have the bot pull their real Discord PFP, name, and banner.'}
          </p>
        </div>
      )}
    </div>
  );
}

function RobloxResult({ profile, onReload }) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [banningIp, setBanningIp] = useState(false);
  const { username, displayName, description, createdDate, isBanned, headshot, fullBody, groups, moderations } = profile;
  const modCount = moderations.length;
  const banCount = moderations.filter((m) => m.moderation_type?.includes('Ban')).length;
  const activeCount = moderations.filter((m) => m.status === 'Active').length;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="flex gap-4">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white/5 border border-white/15 shrink-0">
              {headshot ? (
                <img src={headshot} alt={username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <UserIcon className="h-10 w-10 text-slate-500" />
                </div>
              )}
            </div>
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white/5 border border-white/15 shrink-0 hidden sm:block">
              {fullBody ? (
                <img src={fullBody} alt={username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <UserIcon className="h-10 w-10 text-slate-500" />
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-bold text-white">{displayName || username}</h3>
              {displayName && displayName !== username && (
                <span className="text-sm text-slate-400">@{username}</span>
              )}
              {isBanned && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/30">BANNED</span>
              )}
            </div>
            <div className="mt-1 text-xs text-slate-500">User ID: {profile.userId}</div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Stat icon={Calendar} label="Account Age" value={accountAge(createdDate)} />
              <Stat icon={Gavel} label="Total Mods" value={modCount} />
              <Stat icon={Shield} label="Bans" value={banCount} cls="text-rose-300" />
              <Stat icon={AlertTriangle} label="Active" value={activeCount} cls="text-amber-300" />
            </div>
          </div>
        </div>
        {description && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5">
              <FileText className="h-3.5 w-3.5" /> Description
            </div>
            <p className="text-sm text-slate-300 whitespace-pre-wrap line-clamp-4">{description}</p>
          </div>
        )}
        <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" /> Joined Roblox: {createdDate ? new Date(createdDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
        </div>
      </div>

      {/* Website Account Info */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
        <div className="flex items-center gap-2 mb-3">
          <UserIcon className="h-4 w-4 text-cyan-400" />
          <h4 className="text-sm font-semibold text-white">Website Account</h4>
          {profile.websiteAccount ? (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">Registered</span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-500/15 text-slate-400 border border-slate-500/30">Not registered</span>
          )}
        </div>
        {profile.websiteAccount ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="text-slate-500">Email:</span>
              <span className="text-white">{profile.websiteAccount.email}</span>
            </div>
            {(profile.websiteAccount.last_ip || profile.websiteAccount.data?.last_ip) && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="text-slate-500">Last IP:</span>
                <span className="text-white font-mono">{profile.websiteAccount.last_ip || profile.websiteAccount.data?.last_ip}</span>
              </div>
            )}
            {(profile.websiteAccount.last_seen || profile.websiteAccount.data?.last_seen) && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="text-slate-500">Last seen:</span>
                <span className="text-white">{new Date(profile.websiteAccount.last_seen || profile.websiteAccount.data?.last_seen).toLocaleString()}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="text-slate-500">Role:</span>
              <span className="text-white">{profile.websiteAccount.role || 'user'}</span>
            </div>
            {(profile.websiteAccount.last_ip || profile.websiteAccount.data?.last_ip) && (
              <Button
                size="sm"
                onClick={async () => {
                  setBanningIp(true);
                  try {
                    await db.entities.IpBan.create({
                      ip_address: profile.websiteAccount.last_ip || profile.websiteAccount.data?.last_ip,
                      reason: `Banned via user lookup — ${username}`,
                      banned_by: currentUser?.email || 'Unknown',
                    });
                    toast({ title: 'IP banned successfully' });
                  } catch {
                    toast({ title: 'Failed to ban IP', variant: 'destructive' });
                  } finally {
                    setBanningIp(false);
                  }
                }}
                disabled={banningIp}
                className="bg-rose-600 hover:bg-rose-500 text-white border-0 mt-2"
              >
                {banningIp ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <ShieldBan className="h-4 w-4 mr-1.5" />}
                Ban IP Address
              </Button>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">This Roblox user has not created an account on the portal.</p>
        )}
      </div>

      {groups.length > 0 && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-cyan-400" />
            <h4 className="text-sm font-semibold text-white">Communities ({groups.length})</h4>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {groups.slice(0, 12).map((g) => (
              <div key={g.id} className="flex items-center justify-between rounded-lg bg-slate-950/40 border border-white/5 px-3 py-2">
                <div className="min-w-0">
                  <div className="text-sm text-white truncate">{g.name}</div>
                  <div className="text-xs text-slate-500">{g.role} · Rank {g.rank}</div>
                </div>
                <div className="text-xs text-slate-500 shrink-0 ml-2">{g.memberCount?.toLocaleString() || '—'} members</div>
              </div>
            ))}
          </div>
          {groups.length > 12 && <div className="mt-2 text-xs text-slate-500 text-center">+ {groups.length - 12} more groups</div>}
        </div>
      )}

      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Gavel className="h-4 w-4 text-cyan-400" />
          <h4 className="text-sm font-semibold text-white">Portal Moderation History ({modCount})</h4>
        </div>
        {modCount === 0 ? (
          <div className="text-sm text-slate-500 py-8 text-center">No moderation actions on record — clean history.</div>
        ) : (
          <div className="space-y-2">
            {moderations.map((m) => (
              <div key={m.id} className="flex items-start justify-between gap-3 rounded-xl bg-slate-950/40 border border-white/5 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${MOD_TYPE_STYLES[m.moderation_type] || 'text-slate-300 bg-slate-500/10 border-slate-500/20'}`}>{m.moderation_type}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${m.status === 'Active' ? 'text-amber-300 bg-amber-500/10 border-amber-500/20' : 'text-slate-400 bg-slate-500/10 border-slate-500/20'}`}>{m.status}</span>
                    {m.duration && <span className="text-xs text-slate-500">{m.duration}</span>}
                  </div>
                  <div className="text-sm text-slate-300 mt-1">{m.reason}</div>
                  {m.details && <div className="text-xs text-slate-500 mt-0.5">{m.details}</div>}
                  <div className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    {m.moderation_date ? new Date(m.moderation_date).toLocaleDateString() : '—'}
                    {m.staff_member && <span>· Staff: {m.staff_member}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <UserLookupAppeals appeals={profile.appeals || []} moderations={moderations} username={profile.username} onUpdated={onReload} />
    </div>
  );
}

function DiscordResult({ data, onFetchProfile, fetching }) {
  const { discordId, username, actions, avatarUrl, displayName, accentColor, bannerUrl, bio, accountCreated, hasProfile, hasHistory } = data;
  const modActions = actions.filter((a) => a.action_type !== 'lookup');
  const pending = modActions.filter((a) => a.status === 'pending').length;
  const bans = modActions.filter((a) => a.action_type === 'ban').length;
  const timeouts = modActions.filter((a) => a.action_type === 'timeout').length;
  const kicks = modActions.filter((a) => a.action_type === 'kick').length;

  return (
    <div className="space-y-4">
      {/* Profile header card */}
      <div className="rounded-2xl bg-[#1e1f22] border border-white/10 p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full overflow-hidden bg-[#313338] shrink-0 shadow-lg">
            <img src={avatarUrl} alt={displayName || username} className="w-full h-full object-cover" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Display name */}
            <h3
              className="text-2xl font-bold leading-tight"
              style={{ color: accentColor || '#f2f3f5' }}
            >
              {displayName || username}
            </h3>
            {/* Username */}
            <div className="text-base text-[#949ba3] font-medium">@{username}</div>
            {/* Discord ID */}
            <div className="text-xs text-[#949ba3]/70 mt-1.5">Discord ID: {discordId}</div>

            {/* Account created */}
            {accountCreated && (
              <div className="text-xs text-[#949ba3] mt-2 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Joined Discord: {new Date(accountCreated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                <span className="text-[#949ba3]/60">({accountAge(accountCreated)})</span>
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {bio && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-1.5 text-xs text-[#949ba3] mb-1.5">
              <MessageSquare className="h-3.5 w-3.5" /> About Me
            </div>
            <p className="text-sm text-[#dbdee1] whitespace-pre-wrap">{bio}</p>
          </div>
        )}

        {/* Stats grid */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat icon={Gavel} label="Total Actions" value={modActions.length} />
          <Stat icon={Clock} label="Pending" value={pending} cls="text-amber-300" />
          <Stat icon={Shield} label="Bans" value={bans} cls="text-rose-300" />
          <Stat icon={AlertTriangle} label="Timeouts" value={timeouts} cls="text-orange-300" />
        </div>
      </div>

      {/* Action history */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="h-4 w-4 text-indigo-400" />
          <h4 className="text-sm font-semibold text-white">Discord Action History ({modActions.length})</h4>
        </div>
        {modActions.length === 0 ? (
          <div className="text-sm text-slate-500 py-8 text-center">
            <Bot className="h-8 w-8 mx-auto mb-2 opacity-30" />
            No moderation history for this Discord user — they have a clean record in the portal.
          </div>
        ) : (
          <div className="space-y-2">
            {modActions.map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-3 rounded-xl bg-slate-950/40 border border-white/5 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${DISCORD_ACTION_STYLES[a.action_type] || 'text-slate-300 bg-slate-500/10 border-slate-500/20'}`}>{a.action_type}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                      a.status === 'completed' ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' :
                      a.status === 'pending' ? 'text-amber-300 bg-amber-500/10 border-amber-500/20' :
                      'text-rose-300 bg-rose-500/10 border-rose-500/20'
                    }`}>{a.status}</span>
                    {a.duration_minutes && <span className="text-xs text-slate-500">{a.duration_minutes}m</span>}
                  </div>
                  <div className="text-sm text-slate-300 mt-1">{a.reason}</div>
                  {a.result_message && (
                    <div className={`text-xs mt-0.5 ${a.status === 'failed' ? 'text-rose-400' : 'text-emerald-400'}`}>{a.result_message}</div>
                  )}
                  <div className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    {a.created_date ? new Date(a.created_date).toLocaleDateString() : '—'}
                    {a.issued_by && <span>· By: {a.issued_by}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, cls }) {
  return (
    <div className="rounded-lg bg-slate-950/40 border border-white/5 p-2.5 text-center">
      <div className={`text-lg font-bold ${cls || 'text-white'}`}>{value}</div>
      <div className="text-[10px] text-slate-500 uppercase tracking-wide flex items-center justify-center gap-1">
        <Icon className="h-2.5 w-2.5" /> {label}
      </div>
    </div>
  );
}