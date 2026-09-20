const WEBHOOK_URL =
  'https://discord.com/api/webhooks/1550634657320673400/ootH6wYSRKEGLVQnkuZgFRys2jEZr8KrAe2UOYFwAgJj7cAupR1UPJP8j_4j-Pvou5jv';

/**
 * Pings the staff Discord channel when a player submits an appeal.
 * Fire-and-forget: never throws, never blocks the appeal submission.
 *
 * NOTE: the webhook URL lives in client code, so it is visible in the
 * published app bundle. Hiding it requires a backend function (Builder+),
 * which reads the URL from the DISCORD_APPEAL_WEBHOOK_URL secret instead.
 *
 * The URL below currently returns "Invalid Webhook Token" — replace it with
 * a fresh webhook URL from Discord (channel Settings → Integrations → Webhooks).
 */
export async function sendAppealWebhook({ username, moderationType, reason, appealId }) {
  try {
    const adminUrl = `${window.location.origin}/admin`;
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [
          {
            title: '📝 New appeal submitted',
            url: adminUrl,
            color: 0x22d3ee,
            fields: [
              { name: 'Player', value: username || 'Unknown', inline: true },
              { name: 'Moderation', value: moderationType || '—', inline: true },
              { name: 'Appeal reason', value: (reason || '—').slice(0, 1024) },
            ],
            footer: { text: appealId ? `Appeal ID: ${appealId}` : 'Escape Tsunami Portal' },
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });
  } catch {
    /* ignore — webhook must never block the appeal flow */
  }
}

/**
 * Pings the staff Discord channel when a staff member handles an appeal.
 * Shows the decision and who handled it, so staff don't duplicate work.
 * Fire-and-forget: never throws, never blocks the decision flow.
 */
export async function sendAppealDecisionWebhook({ username, moderationType, decision, staffName, appealId }) {
  try {
    const adminUrl = `${window.location.origin}/admin`;
    const colors = {
      Approved: 0x22c55e,
      Denied: 0xef4444,
      'Under Review': 0x8b5cf6,
      Pending: 0xf59e0b,
    };
    const emojis = {
      Approved: '✅',
      Denied: '❌',
      'Under Review': '🔍',
      Pending: '⏳',
    };
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [
          {
            title: `${emojis[decision] || '📋'} Appeal handled — ${decision}`,
            url: adminUrl,
            color: colors[decision] || 0x64748b,
            fields: [
              { name: 'Player', value: username || 'Unknown', inline: true },
              { name: 'Moderation', value: moderationType || '—', inline: true },
              { name: 'Handled by', value: staffName || 'Unknown staff', inline: true },
            ],
            footer: { text: appealId ? `Appeal ID: ${appealId}` : 'Escape Tsunami Portal' },
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });
  } catch {
    /* ignore */
  }
}