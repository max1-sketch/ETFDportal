/**
 * Determines whether a user is an "owner" — either a platform admin,
 * a @staffwaitrose.net account holder, or a user with the is_owner flag set.
 */
export function isOwner(user) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.email && user.email.endsWith('@staffwaitrose.net')) return true;
  if (user.data && user.data.is_owner === true) return true;
  return false;
}