import { useEffect, useState } from 'react';
import { Flame, Trophy, Loader2, Check, Gift, CalendarCheck } from 'lucide-react';

const db = globalThis.__B44_DB__ || { 
  auth: { isAuthenticated: async () => false, me: async () => null }, 
  entities: new Proxy({}, { 
    get: () => ({ 
      filter: async () => [], 
      get: async () => null, 
      create: async () => ({}), 
      update: async () => ({}), 
      delete: async () => ({}) 
    }) 
  }), 
  integrations: { Core: { UploadFile: async () => ({ file_url: '' }) } } 
};

const STREAK_GOAL = 7;
const DISCORD_CONNECTOR_ID = 'YOUR_CONNECTOR_ID'; // Replace with your actual Base44 Connector ID

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function daysBetween(dateStr) {
  if (!dateStr) return Infinity;
  const last = new Date(dateStr + 'T00:00:00');
  const today = new Date(todayStr() + 'T00:00:00');
  return Math.floor((today - last) / 86400000);
}

export default function DailyStreakQuest({ robloxUsername }) {
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [connectingDiscord, setConnectingDiscord] = useState(false);

  const loadStreak = async () => {
    try {
      const records = await db.entities.UserStreak.filter({ roblox_username: robloxUsername }, '-created_date', 1);
      if (records && records.length > 0) {
        setStreak(records[0]);
      } else {
        const created = await db.entities.UserStreak.create({
          roblox_username: robloxUsername,
          current_streak: 0,
          tag_unlocked: false,
          total_days_claimed: 0,
        });
        setStreak(created);
      }
    } catch {
      setStreak(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (robloxUsername) loadStreak();
  }, [robloxUsername]);

  const handleConnectDiscord = async () => {
    try {
      setConnectingDiscord(true);
      if (db.connectors?.connectAppUser) {
        await db.connectors.connectAppUser(DISCORD_CONNECTOR_ID);
      } else if (globalThis.base44?.connectors?.connectAppUser) {
        await globalThis.base44.connectors.connectAppUser(DISCORD_CONNECTOR_ID);
      }
    } catch (err) {
      console.error('Failed to connect Discord:', err);
    } finally {
      setConnectingDiscord(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-6 rounded-2xl bg-white/[0.03] border border-white/10 p-6 flex items-center gap-2 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading streak quest…
      </div>
    );
  }

  if (!streak) return null;

  const lastClaim = streak.last_claimed_date;
  const gap = daysBetween(lastClaim);
  const alreadyClaimedToday = lastClaim === todayStr();
  const streakWillReset = !alreadyClaimedToday && gap > 1;
  const effectiveStreak = streakWillReset ? 0 : streak.current_streak;
  const isDiscordConnected = Boolean(streak.discord_id);
  const canClaim = !alreadyClaimedToday && isDiscordConnected;

  const claim = async () => {
    if (!canClaim || claiming) return;
    setClaiming(true);
    try {
      const newStreak = streakWillReset ? 1 : streak.current_streak + 1;
      const tagUnlocked = newStreak >= STREAK_GOAL || streak.tag_unlocked;
      const updated = await db.entities.UserStreak.update(streak.id, {
        current_streak: newStreak,
        last_claimed_date: todayStr(),
        tag_unlocked: tagUnlocked,
        total_days_claimed: (streak.total_days_claimed || 0) + 1,
      });
      setStreak(updated);

      // Try to assign the Discord role via backend function
      if (newStreak >= STREAK_GOAL && !streak.tag_unlocked && streak.discord_id) {
        try {
          await db.functions.invoke('assign-devoted-role', {
            discord_id: streak.discord_id,
            roblox_username: robloxUsername,
          });
        } catch {
          /* function may not exist yet — silently ignore until backend is set up */
        }
      }
    } finally {
      setClaiming(false);
    }
  };

  const days = Array.from({ length: STREAK_GOAL }, (_, i) => i + 1);
  const tagUnlocked = streak.tag_unlocked;

  return (
    <div className="mt-6 rounded-2xl bg-gradient-to-br from-amber-500/[0.06] to-orange-600/[0.06] border border-amber-500/20 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Flame className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              7-Day Devoted Quest
              {tagUnlocked && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                  <Trophy className="h-2.5 w-2.5" /> Unlocked
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Log in and claim your streak daily for 7 days to unlock the in-game <span className="text-amber-300 font-medium">Devoted</span> tag.</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-bold text-amber-300">{effectiveStreak}</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wide">day streak</div>
        </div>
      </div>

      {/* Day progress */}
      <div className="mt-4 flex items-center gap-1.5">
        {days.map((d) => {
          const claimed = d <= effectiveStreak;
          const isToday = d === effectiveStreak + 1 && canClaim;
          return (
            <div
              key={d}
              className={`flex-1 flex flex-col items-center gap-1.5 transition-all`}
            >
              <div
                className={`h-9 w-full rounded-lg flex items-center justify-center text-xs font-semibold border transition-all ${
                  claimed
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : isToday
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-200 animate-pulse'
                    : 'bg-white/[0.02] border-white/10 text-slate-600'
                }`}
              >
                {claimed ? <Check className="h-4 w-4" /> : d}
              </div>
              <span className={`text-[9px] ${claimed ? 'text-amber-400' : 'text-slate-600'}`}>Day {d}</span>
            </div>
          );
        })}
      </div>

      {/* Status / claim / connect section */}
      <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {!isDiscordConnected ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-3">
            <div className="text-sm text-amber-400 font-medium">
              Connect your Discord account to begin claiming your streak rewards.
            </div>
            <button
              onClick={handleConnectDiscord}
              disabled={connectingDiscord}
              className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white transition-all shrink-0 disabled:opacity-50"
            >
              {connectingDiscord ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Connect Discord
            </button>
          </div>
        ) : (
          <>
            {tagUnlocked ? (
              <div className="flex items-center gap-2 text-sm text-emerald-300">
                <Gift className="h-4 w-4" /> You've unlocked the Devoted tag! It will be awarded in-game soon.
              </div>
            ) : alreadyClaimedToday ? (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <CalendarCheck className="h-4 w-4 text-emerald-400" /> Claimed today — come back tomorrow to continue your streak.
              </div>
            ) : streakWillReset && streak.current_streak > 0 ? (
              <div className="flex items-center gap-2 text-sm text-rose-300">
                <Flame className="h-4 w-4" /> You missed a day — claiming now resets your streak to Day 1.
              </div>
            ) : (
              <div className="text-sm text-slate-400">Claim today to keep your streak alive.</div>
            )}

            <button
              onClick={claim}
              disabled={!canClaim || claiming || tagUnlocked}
              className={`inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-all shrink-0 ${
                canClaim && !tagUnlocked
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-400 hover:to-orange-500 shadow-lg shadow-amber-500/20'
                  : 'bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed'
              }`}
            >
              {claiming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flame className="h-4 w-4" />}
              {alreadyClaimedToday ? 'Claimed' : 'Claim today'}
            </button>
          </>
        )}
      </div>

      {streak.total_days_claimed > 0 && (
        <div className="mt-3 pt-3 border-t border-white/5 text-[11px] text-slate-500">
          Total days claimed: {streak.total_days_claimed}
        </div>
      )}
    </div>
  );
}