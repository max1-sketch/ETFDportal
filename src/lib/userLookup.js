const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };


// Case-insensitive Roblox username → portal User account lookup.
// Tries exact match first, then falls back to scanning all users.
export async function findUserByRobloxUsername(username) {
  if (!username) return null;

  // 1. Exact match (fast path)
  try {
    const users = await db.entities.User.filter(
      { roblox_username: username },
      '-created_date',
      5
    );
    if (users.length > 0) return users[0];
  } catch {}

  // 2. Case-insensitive fallback (the user may have registered with different casing)
  // Check both top-level roblox_username and data.roblox_username since updateMe
  // may store the field in either location depending on the schema.
  try {
    const allUsers = await db.entities.User.list('-created_date', 1000);
    const lower = username.toLowerCase();
    return (
      allUsers.find(
        (u) => {
          const saved = u.roblox_username || u.data?.roblox_username || '';
          return saved.toLowerCase() === lower;
        }
      ) || null
    );
  } catch {}

  return null;
}