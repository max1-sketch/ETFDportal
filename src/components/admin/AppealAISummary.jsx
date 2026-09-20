const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from 'react';

import { Sparkles, Loader2, AlertTriangle, Zap } from 'lucide-react';

export default function AppealAISummary({ chatLogs, exploitLogs, moderation, appeal }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const summarize = async () => {
    setLoading(true);
    setError('');
    setSummary(null);
    try {
      const chatText = chatLogs
        .slice(-50)
        .map((l) => `[${l.time || new Date(l.timestamp).toLocaleTimeString()}] ${l.msg}`)
        .join('\n');
      const exploitText = exploitLogs
        .slice(-20)
        .map((l) => `${l.exploitType}: ${l.details} (${new Date(l.timestamp).toLocaleString()})`)
        .join('\n');

      const prompt = `You are a moderation assistant for the Roblox game "Escape Tsunami". Summarize the context around a player's infraction to help staff review an appeal quickly.

PLAYER: ${appeal?.roblox_username || 'Unknown'}
MODERATION: ${moderation?.moderation_type || 'Unknown'} — Reason: ${moderation?.reason || 'N/A'}
MODERATION DETAILS: ${moderation?.details || 'N/A'}

RECENT CHAT LOGS (most relevant at the end):
${chatText || '(no chat logs available)'}

EXPloit DETECTIONS:
${exploitText || '(no exploit detections)'}

Produce a concise TL;DR (max 6 short bullet points) highlighting:
- Toxic / inappropriate keywords or language used
- Spamming patterns
- Exploit triggers detected
- Whether the chat context appears to justify the moderation
- Any notable behavior right before the infraction

Be neutral and factual. Do not make a ruling — just summarize what the logs show.`;

      const res = await db.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            bullets: { type: 'array', items: { type: 'string' } },
            verdict: { type: 'string', description: 'Context justifies moderation / Mixed / Context does not justify' },
            flags: { type: 'array', items: { type: 'string' }, description: 'toxic, spam, exploit, evasion, none' },
          },
        },
      });
      setSummary(res);
    } catch (e) {
      setError('Failed to generate summary. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl bg-gradient-to-br from-cyan-500/5 to-blue-600/5 border border-cyan-500/15 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-cyan-400" />
          <span className="text-sm font-medium text-white">AI Context Summarizer</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wide">TL;DR of logs</span>
        </div>
        <button
          onClick={summarize}
          disabled={loading || (chatLogs.length === 0 && exploitLogs.length === 0)}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/25 text-cyan-200 hover:bg-cyan-500/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {loading ? 'Summarizing…' : summary ? 'Regenerate' : 'Summarize logs'}
        </button>
      </div>

      {error && <p className="mt-3 text-xs text-rose-400 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> {error}</p>}

      {summary && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {(summary.flags || []).map((f) => (
              <span key={f} className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
                <Zap className="h-2.5 w-2.5" /> {f}
              </span>
            ))}
            <span className={`inline-flex items-center text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
              summary.verdict?.includes('justifies') ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
              : summary.verdict?.includes('Mixed') ? 'bg-violet-500/10 text-violet-300 border-violet-500/20'
              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
            }`}>
              {summary.verdict}
            </span>
          </div>
          <ul className="space-y-1.5">
            {(summary.bullets || []).map((b, i) => (
              <li key={i} className="text-xs text-slate-300 flex gap-2">
                <span className="text-cyan-400 shrink-0">•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}