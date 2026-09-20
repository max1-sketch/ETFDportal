const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };


export async function findUserEmailByUsername(robloxUsername) {
  if (!robloxUsername) return null;
  try {
    const users = await db.entities.User.filter({ roblox_username: robloxUsername }, undefined, 1);
    return users?.[0]?.email || null;
  } catch {
    return null;
  }
}

export async function emailPlayer({ robloxUsername, email, subject, body }) {
  const to = email || (robloxUsername ? await findUserEmailByUsername(robloxUsername) : null);
  if (!to) return false;
  try {
    await db.integrations.Core.SendEmail({ to, subject, body });
    return true;
  } catch {
    return false;
  }
}