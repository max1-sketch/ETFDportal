const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };


/**
 * Records a staff action in the StaffLog entity for audit.
 * Swallows errors so logging never blocks the underlying action.
 */
export async function logStaffAction(user, action, target, detail) {
  try {
    await db.entities.StaffLog.create({
      staff_username: user?.full_name || user?.email || 'Unknown staff',
      action,
      target: target || '',
      detail,
    });
  } catch {
    /* ignore */
  }
}