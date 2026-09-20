const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

/* eslint-disable no-undef */
/**
 * Discord Moderation Poller — Escape Tsunami Portal
 *
 * Connects your Discord bot to the website so staff can remotely
 * moderate Discord users (timeout, kick, ban, etc.) from the admin dashboard.
 *
 * The bot polls the website's API for pending actions, executes them in Discord,
 * caches the user's profile (PFP, display name, banner, accent color, bio, join date),
 * and reports the result back.
 *
 * ========== SETUP ==========
 *
 * 1. Go to the "API" page in your app dashboard on db.
 * 2. Generate a personal access token and note your App ID.
 * 3. Add these to your bot's .env file:
 *
 *    PORTAL_APP_ID=your_app_id_here
 *    PORTAL_API_KEY=your_personal_access_token_here
 *    DISCORD_GUILD_ID=your_discord_server_id_here
 *
 * 4. Copy this file into your bot project (next to index.js).
 * 5. In your bot's index.js, after client.login(process.env.BOT_TOKEN), add:
 *
 *    const { startModerationPoller } = require('./discord-moderation-poller');
 *    startModerationPoller(client);
 *
 * ========== HOW IT WORKS ==========
 *
 * - Staff queues a Discord action from the admin dashboard (Moderations tab)
 * - The action is saved as a "pending" DiscordAction record on the website
 * - This poller fetches pending actions every 10 seconds
 * - For each action, the bot:
 *     1. Fetches and caches the user's full Discord profile
 *     2. Executes the action (timeout/kick/ban/etc.) or just looks up (for "lookup" type)
 *     3. Updates the action with status + result + cached profile data
 * - The dashboard auto-refreshes to show the result and profile
 */

const API_BASE = process.env.PORTAL_API_URL || 'https://db.app/api/apps';
const POLL_INTERVAL = 10000; // 10 seconds

let isPolling = false;

/**
 * Fetches all pending Discord actions from the website.
 */
async function getPendingActions(appId, apiKey) {
  const url = `${API_BASE}/${appId}/entities/DiscordAction`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}\n  URL: ${url}\n  AppId: ${appId}`);
  const data = await res.json();
  const items = Array.isArray(data) ? data : (data.items || data.data || []);
  return items.filter((a) => a.status === 'pending');
}

/**
 * Updates a Discord action on the website.
 */
async function updateAction(appId, apiKey, id, updates) {
  const url = `${API_BASE}/${appId}/entities/DiscordAction/${id}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

/**
 * Fetches a Discord user's full profile and returns cacheable data.
 * Tries fetchProfile() for banner/accent/bio, falls back to user properties.
 */
async function fetchProfileData(client, userId) {
  const user = await client.users.fetch(userId, { force: true });

  let bannerUrl = null;
  let accentColor = null;
  let bio = null;

  // Try fetchProfile() for banner, accent color, bio (discord.js v14.14+)
  try {
    if (typeof user.fetchProfile === 'function') {
      const profile = await user.fetchProfile();
      if (profile.bannerURL) {
        try { bannerUrl = profile.bannerURL({ size: 512, extension: 'png' }); } catch {}
      }
      if (profile.accentColor != null) {
        accentColor = '#' + profile.accentColor.toString(16).padStart(6, '0');
      }
      if (profile.bio) bio = profile.bio;
    }
  } catch (err) {
    console.warn(`[PortalPoller] fetchProfile() failed for ${userId}: ${err.message}`);
  }

  // Fallbacks: try user properties directly
  if (!accentColor && user.accentColor != null) {
    accentColor = '#' + user.accentColor.toString(16).padStart(6, '0');
  }
  if (!bannerUrl && typeof user.bannerURL === 'function') {
    try { bannerUrl = user.bannerURL({ size: 512, extension: 'png' }); } catch {}
  }

  const avatarUrl = user.displayAvatarURL({ size: 256, extension: 'png' });
  const displayName = user.globalName || user.displayName || null;
  const accountCreated = user.createdAt ? user.createdAt.toISOString() : null;

  return {
    user,
    profileData: {
      discord_username: user.username,
      avatar_url: avatarUrl,
      display_name: displayName,
      accent_color: accentColor,
      banner_url: bannerUrl,
      bio,
      account_created: accountCreated,
      profile_fetched_at: new Date().toISOString(),
    },
  };
}

/**
 * Sends a DM to the target user about the moderation action.
 * Must be called BEFORE kick/ban (user leaves the server and can't be DM'd after).
 */
async function sendModerationDM(client, guild, action, resultText) {
  try {
    const user = await client.users.fetch(action.discord_user_id);
    const embed = {
      color: 0x1c7ed6,
      title: `🔔 Moderation Notice — ${guild.name}`,
      description: `You have received a **${action.action_type}** in **${guild.name}**.`,
      fields: [
        { name: 'Action', value: action.action_type, inline: true },
        ...(action.duration_minutes ? [{ name: 'Duration', value: `${action.duration_minutes} minute(s)`, inline: true }] : []),
        { name: 'Reason', value: action.reason || 'No reason provided', inline: false },
        { name: 'Result', value: resultText, inline: false },
      ],
      footer: { text: 'Escape Tsunami Staff Team' },
      timestamp: new Date().toISOString(),
    };
    await user.send({ embeds: [embed] });
    console.log(`[PortalPoller] DM sent to ${action.discord_username || action.discord_user_id}`);
  } catch (err) {
    console.warn(`[PortalPoller] Could not DM ${action.discord_user_id}: ${err.message}`);
  }
}

/**
 * Executes a single Discord moderation action using the discord.js client.
 */
async function executeAction(client, guildId, action) {
  const guild = await client.guilds.fetch(guildId);

  switch (action.action_type) {
    case 'timeout': {
      const member = await guild.members.fetch(action.discord_user_id);
      const minutes = action.duration_minutes || 5;
      const resultText = `Timed out for ${minutes} minute(s)`;
      await sendModerationDM(client, guild, action, resultText);
      await member.timeout(minutes * 60 * 1000, action.reason || 'No reason provided');
      return resultText;
    }
    case 'untimeout': {
      const member = await guild.members.fetch(action.discord_user_id);
      const resultText = 'Timeout removed';
      await sendModerationDM(client, guild, action, resultText);
      await member.timeout(null, action.reason || 'Timeout removed');
      return resultText;
    }
    case 'kick': {
      const member = await guild.members.fetch(action.discord_user_id);
      const resultText = 'Kicked from server';
      await sendModerationDM(client, guild, action, resultText);
      await member.kick(action.reason || 'No reason provided');
      return resultText;
    }
    case 'ban': {
      const resultText = 'Banned from server';
      await sendModerationDM(client, guild, action, resultText);
      await guild.bans.create(action.discord_user_id, {
        reason: action.reason || 'No reason provided',
      });
      return resultText;
    }
    case 'unban': {
      const resultText = 'Unbanned';
      await guild.bans.remove(action.discord_user_id, action.reason || 'Unbanned');
      await sendModerationDM(client, guild, action, resultText);
      return resultText;
    }
    default:
      throw new Error(`Unknown action type: ${action.action_type}`);
  }
}

/**
 * One poll cycle: fetch pending actions, execute each, cache profiles, update results.
 */
async function pollAndExecute(client) {
  if (isPolling) return;
  isPolling = true;

  const appId = process.env.PORTAL_APP_ID;
  const apiKey = process.env.PORTAL_API_KEY;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!appId || !apiKey || !guildId) {
    console.error('[PortalPoller] Missing env vars. Set PORTAL_APP_ID, PORTAL_API_KEY, DISCORD_GUILD_ID in .env');
    isPolling = false;
    return;
  }

  try {
    const actions = await getPendingActions(appId, apiKey);
    if (actions.length > 0) {
      console.log(`[PortalPoller] Found ${actions.length} pending Discord action(s)`);
    }

    for (const action of actions) {
      const target = action.discord_username || action.discord_user_id;
      console.log(`[PortalPoller] Processing ${action.action_type} on ${target}…`);

      try {
        let result = '';
        let profileUpdate = {};

        // Always try to fetch and cache the user's profile
        try {
          const { user, profileData } = await fetchProfileData(client, action.discord_user_id);
          profileUpdate = profileData;

          if (action.action_type === 'lookup') {
            result = `Profile fetched for ${user.username}`;
          } else {
            result = await executeAction(client, guildId, action);
          }
        } catch (profileErr) {
          if (action.action_type === 'lookup') throw profileErr;
          // For moderation actions, proceed without profile cache
          console.warn(`[PortalPoller] Could not cache profile for ${target}: ${profileErr.message}`);
          result = await executeAction(client, guildId, action);
        }

        await updateAction(appId, apiKey, action.id, {
          ...profileUpdate,
          status: 'completed',
          result_message: result,
          executed_at: new Date().toISOString(),
        });
        console.log(`[PortalPoller] ✓ ${result} — ${target}`);
      } catch (err) {
        // Mark the action as failed so the dashboard can show the error
        const errMsg = err.message || String(err);
        console.error(`[PortalPoller] ✗ ${action.action_type} on ${target} failed: ${errMsg}`);
        try {
          await updateAction(appId, apiKey, action.id, {
            status: 'failed',
            result_message: errMsg,
            executed_at: new Date().toISOString(),
          });
        } catch (updateErr) {
          console.error(`[PortalPoller] Could not update failed action: ${updateErr.message}`);
        }
      }
    }
  } catch (err) {
    console.error('[PortalPoller] Poll error:', err.message);
  } finally {
    isPolling = false;
  }
}

/**
 * Call this after your bot logs in to start polling.
 * @param {import('discord.js').Client} client - Your discord.js client
 */
function startModerationPoller(client) {
  const appId = process.env.PORTAL_APP_ID;
  const apiKey = process.env.PORTAL_API_KEY;
  const guildId = process.env.DISCORD_GUILD_ID;
  console.log('[PortalPoller] Started — polling for pending Discord actions every 10s');
  console.log('[PortalPoller] Config:');
  console.log('  API_BASE:', API_BASE);
  console.log('  PORTAL_APP_ID:', appId ? `${appId.slice(0, 8)}…` : '(missing!)');
  console.log('  PORTAL_API_KEY:', apiKey ? `${apiKey.slice(0, 6)}…` : '(missing!)');
  console.log('  DISCORD_GUILD_ID:', guildId ? `${guildId.slice(0, 6)}…` : '(missing!)');
  console.log('  Poll URL:', `${API_BASE}/${appId}/entities/DiscordAction`);
  pollAndExecute(client).catch(() => {});
  setInterval(() => pollAndExecute(client).catch(() => {}), POLL_INTERVAL);
}

/**
 * Sends moderation DM info to the website so it can issue a web notification.
 */
async function sendWebsiteNotification(params) {
  const appId = process.env.PORTAL_APP_ID;
  const apiKey = process.env.PORTAL_API_KEY;
  if (!appId || !apiKey) {
    console.warn('[PortalPoller] Cannot send website notification — missing PORTAL_APP_ID or PORTAL_API_KEY');
    return null;
  }

  const { discord_user_id, discord_username, action_type, reason, duration_minutes, guild_id, issued_by } = params;
  const displayUser = discord_username || discord_user_id || 'Unknown user';
  const durationText = action_type === 'timeout' && duration_minutes ? ` for ${duration_minutes} minute(s)` : '';

  const url = `${API_BASE}/${appId}/entities/Notification`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      roblox_username: displayUser,
      title: `Discord ${action_type} issued`,
      body: reason || `A Discord ${action_type} has been issued against your account${durationText}.`,
      type: 'moderation_issued',
      read: false,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[PortalPoller] Website notification failed: API ${res.status}: ${body}`);
    return null;
  }

  const data = await res.json();
  console.log(`[PortalPoller] Website notification sent for ${displayUser}`);
  return data;
}

module.exports = { startModerationPoller, sendWebsiteNotification };