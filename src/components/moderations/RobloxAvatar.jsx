import { useEffect, useState } from 'react';
import { User } from 'lucide-react';

async function resolveUserId(username) {
  const res = await fetch(`https://users.roproxy.com/v1/users/search?keyword=${encodeURIComponent(username)}`);
  if (!res.ok) throw new Error('search failed');
  const data = await res.json();
  const match = (data?.data || []).find(
    (u) => (u.name || '').toLowerCase() === username.toLowerCase()
  );
  return match?.id;
}

export default function RobloxAvatar({ username, size = 40 }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let active = true;
    setUrl(null);
    if (!username) return;
    (async () => {
      try {
        const id = await resolveUserId(username);
        if (!id || !active) return;
        const r = await fetch(
          `https://thumbnails.roproxy.com/v1/users/avatar-headshot?userIds=${id}&size=420x420&format=Png&isCircular=false`
        );
        if (!r.ok || !active) return;
        const d = await r.json();
        const u = d?.data?.[0]?.imageUrl;
        if (u && active) setUrl(u);
      } catch {
        /* leave fallback */
      }
    })();
    return () => { active = false; };
  }, [username]);

  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full overflow-hidden bg-white/5 border border-white/15 flex items-center justify-center shrink-0"
    >
      {url ? (
        <img src={url} alt={username} className="w-full h-full object-cover" />
      ) : (
        <User className="text-slate-500" style={{ height: size * 0.5, width: size * 0.5 }} />
      )}
    </div>
  );
}