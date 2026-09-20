// Quick-Response Template Engine — dynamic macros with placeholder variables.
// Placeholders: {PlayerName}, {ModerationType}, {Reason}, {Date}, {TimeElapsed}, {StaffName}

export const RESPONSE_TEMPLATES = [
  {
    label: 'Standard Deny',
    text: 'Hi {PlayerName}, after reviewing your appeal for the {ModerationType} ({Reason}), we have decided to deny it. The moderation stands. Please respect this decision and follow the rules going forward.',
  },
  {
    label: 'Standard Lift',
    text: 'Hi {PlayerName}, your appeal has been approved and your {ModerationType} has been lifted. Welcome back to Escape Tsunami — please follow the rules going forward.',
  },
  {
    label: 'Request More Info',
    text: 'Hi {PlayerName}, we need more information to review your appeal for the {ModerationType}. Please reply with any screenshots, context, or witnesses that support your case.',
  },
  {
    label: 'Reduced Sentence',
    text: 'Hi {PlayerName}, after review we have reduced your {ModerationType}. The original reason ({Reason}) still stands, but we have shortened the duration. Please avoid repeating this behavior.',
  },
  {
    label: 'Final Warning',
    text: 'Hi {PlayerName}, this is a final warning. Your {ModerationType} remains active. Any further infractions will result in a permanent ban with no appeal rights.',
  },
  {
    label: 'Escalated to Owner',
    text: 'Hi {PlayerName}, your appeal for the {ModerationType} has been escalated to the Owner team for a final decision. You will receive an update once reviewed.',
  },
];

export function fillTemplate(text, vars) {
  if (!text) return '';
  return text.replace(/\{(\w+)\}/g, (match, key) => vars[key] ?? match);
}

export function buildTemplateVars({ appeal, moderation, user }) {
  const now = new Date();
  const modDate = moderation?.moderation_date ? new Date(moderation.moderation_date) : null;
  let elapsed = '';
  if (modDate) {
    const days = Math.floor((now - modDate) / 86400000);
    const hours = Math.floor((now - modDate) / 3600000);
    elapsed = days > 0 ? `${days}d` : `${hours}h`;
  }
  return {
    PlayerName: appeal?.roblox_username || 'player',
    ModerationType: moderation?.moderation_type || 'moderation',
    Reason: moderation?.reason || 'the reported behavior',
    Date: modDate ? modDate.toLocaleDateString() : '',
    TimeElapsed: elapsed,
    StaffName: user?.full_name || 'Staff',
  };
}