// Client-side anti-evasion: fingerprinting (canvas, fonts, WebGL),
// persistent tokens (localStorage + cookie + IndexedDB), rate limiting,
// UA validation, IP intelligence (VPN/proxy/ASN), proof-of-work challenges.

const BAN_TOKEN_KEY = '_et_btk';
const BANNED_FPS_KEY = '_et_bfps';
const RATE_KEY = '_et_rl';
const IDB_NAME = '_et_db';
const IDB_STORE = 'tokens';
const SECRET = 'tsunami-shield-2024-x9k2m7';

// === Simple XOR cipher + base64 (obfuscation) ===
function encrypt(text) {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    out += String.fromCharCode(text.charCodeAt(i) ^ SECRET.charCodeAt(i % SECRET.length));
  }
  return btoa(out);
}
function decrypt(encoded) {
  try {
    const decoded = atob(encoded);
    let out = '';
    for (let i = 0; i < decoded.length; i++) {
      out += String.fromCharCode(decoded.charCodeAt(i) ^ SECRET.charCodeAt(i % SECRET.length));
    }
    return out;
  } catch { return ''; }
}

// === IndexedDB helpers ===
function idbSet(key, value) {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
      };
      req.onsuccess = (e) => {
        try {
          const tx = e.target.result.transaction(IDB_STORE, 'readwrite');
          tx.objectStore(IDB_STORE).put(value, key);
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        } catch { resolve(); }
      };
      req.onerror = () => resolve();
    } catch { resolve(); }
  });
}
function idbGet(key) {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
      };
      req.onsuccess = (e) => {
        try {
          const tx = e.target.result.transaction(IDB_STORE, 'readonly');
          const get = tx.objectStore(IDB_STORE).get(key);
          get.onsuccess = () => resolve(get.result || null);
          get.onerror = () => resolve(null);
        } catch { resolve(null); }
      };
      req.onerror = () => resolve(null);
    } catch { resolve(null); }
  });
}

// === Browser Fingerprinting (canvas, fonts, WebGL, hardware) ===
function detectFontCount() {
  const testFonts = [
    'Arial', 'Arial Black', 'Arial Narrow', 'Calibri', 'Cambria', 'Comic Sans MS',
    'Consolas', 'Courier New', 'Georgia', 'Helvetica', 'Impact',
    'Lucida Console', 'Lucida Sans Unicode', 'Microsoft Sans Serif',
    'Palatino Linotype', 'Segoe UI', 'Tahoma', 'Times New Roman',
    'Trebuchet MS', 'Verdana', 'MS Gothic', 'MS PGothic',
    'SimSun', 'SimHei', 'Wingdings', 'Webdings',
  ];
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = '72px "zzzFakeFont999", monospace';
    const baseWidth = ctx.measureText('mmmmmmmmmmlli').width;
    let count = 0;
    for (const font of testFonts) {
      ctx.font = `72px "${font}", monospace`;
      if (ctx.measureText('mmmmmmmmmmlli').width !== baseWidth) count++;
    }
    return count;
  } catch { return -1; }
}

export async function generateFingerprint() {
  const parts = [];
  parts.push(`s:${screen.width}x${screen.height}x${screen.colorDepth}`);
  parts.push(`a:${screen.availWidth}x${screen.availHeight}`);
  parts.push(`c:${navigator.hardwareConcurrency || '?'}`);
  parts.push(`m:${navigator.deviceMemory || '?'}`);
  parts.push(`t:${navigator.maxTouchPoints || 0}`);
  parts.push(`tz:${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
  parts.push(`l:${(navigator.languages || [navigator.language]).join(',')}`);
  parts.push(`p:${navigator.platform}`);
  parts.push(`f:${detectFontCount()}`);

  // Canvas rendering fingerprint
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Escape Tsunami', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Escape Tsunami', 4, 17);
    parts.push(`cv:${canvas.toDataURL().length}`);
  } catch { parts.push('cv:x'); }

  // WebGL renderer
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    if (gl) {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      parts.push(`gl:${ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'n/a'}`);
    }
  } catch { parts.push('gl:x'); }

  // djb2 hash
  const str = parts.join('|');
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return 'fp_' + Math.abs(hash).toString(36);
}

// === Persistent encrypted token (localStorage + cookie + IndexedDB) ===
export function setBanToken(fingerprint) {
  const token = encrypt(`${fingerprint}:${Date.now()}`);
  try { localStorage.setItem(BAN_TOKEN_KEY, token); } catch {}
  try {
    document.cookie = `${BAN_TOKEN_KEY}=${token}; path=/; max-age=31536000; SameSite=Strict`;
  } catch {}
  idbSet('banToken', token).catch(() => {});
}

export function hasBanToken() {
  try {
    const token = localStorage.getItem(BAN_TOKEN_KEY);
    if (token && decrypt(token).includes(':')) return true;
  } catch {}
  try {
    const match = document.cookie.match(new RegExp(`${BAN_TOKEN_KEY}=([^;]+)`));
    if (match && decrypt(match[1]).includes(':')) return true;
  } catch {}
  return false;
}

export async function hasBanTokenIDB() {
  const token = await idbGet('banToken');
  return !!token && decrypt(token).includes(':');
}

// Clear all client-side ban artifacts (token + fingerprint blacklist + IndexedDB).
// Called when the server confirms the IP is no longer banned.
export function clearBanToken() {
  try { localStorage.removeItem(BAN_TOKEN_KEY); } catch {}
  try { localStorage.removeItem(BANNED_FPS_KEY); } catch {}
  try {
    document.cookie = `${BAN_TOKEN_KEY}=; path=/; max-age=0; SameSite=Strict`;
  } catch {}
  idbSet('banToken', null).catch(() => {});
}

// === Fingerprint ban list ===
export function addBannedFingerprint(fp) {
  try {
    const list = JSON.parse(localStorage.getItem(BANNED_FPS_KEY) || '[]');
    if (!list.includes(fp)) {
      list.push(fp);
      localStorage.setItem(BANNED_FPS_KEY, JSON.stringify(list));
    }
  } catch {}
}

export function isFingerprintBanned(fp) {
  try {
    const list = JSON.parse(localStorage.getItem(BANNED_FPS_KEY) || '[]');
    return list.includes(fp);
  } catch { return false; }
}

// === Rate Limiting ===
const RATE_WINDOW_MS = 30 * 1000;
const RATE_MAX_LOADS = 10;

export function checkRateLimit() {
  try {
    const now = Date.now();
    const timestamps = (JSON.parse(localStorage.getItem(RATE_KEY) || '[]'))
      .filter((t) => now - t < RATE_WINDOW_MS);
    if (timestamps.length >= RATE_MAX_LOADS) return false;
    timestamps.push(now);
    localStorage.setItem(RATE_KEY, JSON.stringify(timestamps));
    return true;
  } catch { return true; }
}

// === User-Agent & Header Validation ===
export function validateClient() {
  const ua = navigator.userAgent;
  if (!ua || ua.length < 20) return false;
  const suspicious = ['headless', 'phantom', 'selenium', 'webdriver', 'puppeteer', 'playwright', 'nightmare'];
  if (suspicious.some((s) => ua.toLowerCase().includes(s))) return false;
  if (!/mozilla|webkit|gecko|trident|chromium|chrome|safari|firefox|edge/i.test(ua)) return false;
  if (navigator.webdriver === true) return false;
  if (!navigator.language) return false;
  return true;
}

// === IP Intelligence — VPN / Proxy / Hosting / ASN blocking ===
const BLOCKED_ASNS = [
  'as14061', 'as14618', 'as16509', 'as15169', 'as8075', 'as13335',
  'as24940', 'as16276', 'as63949', 'as20473', 'as396982', 'as55286',
  'as394432', 'as399471',
];
const BLOCKED_ORGS = [
  'digital ocean', 'digitalocean', 'amazon', 'aws', 'google llc', 'google cloud',
  'microsoft', 'azure', 'cloudflare', 'ovh', 'hetzner', 'linode', 'vultr',
  'nordvpn', 'expressvpn', 'private internet access', 'mullvad', 'protonvpn',
  'surfshark', 'cyberghost', 'leaseweb', 'choopa', 'm247', 'datacamp',
  'data center', 'datacenter', 'hosting', 'vps', 'cloud server',
];

export async function checkIpIntelligence(ip) {
  try {
    const res = await fetch(`https://ipinfo.io/${ip}/json`);
    const data = await res.json();
    const org = (data.org || '').toLowerCase();
    const hostname = (data.hostname || '').toLowerCase();

    const asnBlocked = BLOCKED_ASNS.some((a) => org.includes(a));
    const orgBlocked = BLOCKED_ORGS.some((p) => org.includes(p));
    const vpnHost = /vpn|proxy|tor|relay|exit/.test(hostname);

    return {
      threat: asnBlocked || orgBlocked || vpnHost,
      org: data.org,
      hostname: data.hostname,
    };
  } catch {
    return { threat: false };
  }
}

// === Proof-of-Work Challenge ===
// Forces suspicious connections to compute a hash — slows bots, trivial for real browsers.
export async function solveChallenge() {
  const challenge = 'tsunami-' + Date.now().toString(36);
  let nonce = 0;
  while (nonce < 5000000) {
    let hash = 2166136261;
    const input = challenge + nonce;
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    if ((hash >>> 0).toString(16).padStart(8, '0').startsWith('00000')) return true;
    nonce++;
    if (nonce % 100000 === 0) await new Promise((r) => setTimeout(r, 0));
  }
  return true; // Timeout — allow through (don't block real users)
}