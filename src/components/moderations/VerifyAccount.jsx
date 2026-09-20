import { useState } from 'react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Loader2, User, ShieldCheck, KeyRound, ExternalLink, ArrowRight,
  RefreshCw, AlertCircle, Copy, Check, Fingerprint,
} from 'lucide-react';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generateCode() {
  let code = 'ETFD-';
  for (let i = 0; i < 6; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return code;
}

async function resolveRobloxUser(username) {
  const res = await fetch(`https://users.roproxy.com/v1/users/search?keyword=${encodeURIComponent(username)}`);
  if (!res.ok) throw new Error('Could not reach Roblox right now. Please try again.');
  const data = await res.json();
  const match = (data?.data || []).find(
    (u) => (u.name || '').toLowerCase() === username.toLowerCase()
  );
  if (!match) throw new Error('Roblox user not found. Check the spelling and try again.');
  return match;
}

async function fetchBio(userId) {
  const res = await fetch(`https://users.roproxy.com/v1/users/${userId}`);
  if (!res.ok) throw new Error('Could not read that Roblox profile.');
  const data = await res.json();
  return (data?.description || '').toString();
}

export default function VerifyAccount({ onVerified }) {
  const [step, setStep] = useState('enter'); // 'enter' | 'verify'
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const startVerification = () => {
    if (!username.trim()) return;
    setError('');
    setCode(generateCode());
    setStep('verify');
  };

  const verify = async () => {
    setVerifying(true);
    setError('');
    try {
      const found = await resolveRobloxUser(username.trim());
      const bio = await fetchBio(found.id);
      if (bio.includes(code)) {
        onVerified(username.trim());
      } else {
        setError('We could not find the code in your Roblox bio. Make sure you saved it, then try again.');
      }
    } catch (e) {
      setError(e.message || 'Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const reset = () => {
    setStep('enter');
    setUsername('');
    setCode('');
    setError('');
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard?.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
      className="mt-8 rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden shadow-xl shadow-cyan-950/30"
    >
      {/* Step indicator bar */}
      <div className="flex border-b border-white/10">
        <div className={`flex-1 px-6 py-3.5 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-colors ${step === 'enter' ? 'text-cyan-300 bg-cyan-500/[0.07]' : 'text-slate-500'}`}>
          <span className={`flex h-5 w-5 items-center justify-center text-[10px] rounded-full border transition-colors ${step === 'enter' ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300' : 'border-white/15 text-slate-500'}`}>1</span>
          Username
        </div>
        <div className={`flex-1 px-6 py-3.5 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-colors ${step === 'verify' ? 'text-cyan-300 bg-cyan-500/[0.07]' : 'text-slate-500'}`}>
          <span className={`flex h-5 w-5 items-center justify-center text-[10px] rounded-full border transition-colors ${step === 'verify' ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300' : 'border-white/15 text-slate-500'}`}>2</span>
          Verify Bio
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {step === 'enter' && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center shrink-0">
                <Fingerprint className="h-6 w-6 text-cyan-300" />
              </div>
              <div>
                <h2 className="font-semibold text-lg leading-tight">Verify your Roblox account</h2>
                <p className="text-xs text-slate-500 mt-0.5">Step 1 of 2 · Identity check</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-5">
              Enter your exact Roblox username. We will give you a one-time code to add to your Roblox bio, then check it automatically — this stops anyone from viewing or appealing another player's records.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <Label htmlFor="rbx-user" className="sr-only">Roblox username</Label>
                <Input
                  id="rbx-user"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your Roblox username"
                  className="bg-slate-950/50 border-white/15 text-white placeholder:text-slate-500 h-12 pl-10"
                  onKeyDown={(e) => e.key === 'Enter' && startVerification()}
                />
              </div>
              <Button
                onClick={startVerification}
                disabled={!username.trim()}
                className="h-12 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-0"
              >
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 'verify' && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center shrink-0">
                <KeyRound className="h-6 w-6 text-cyan-300" />
              </div>
              <div>
                <h2 className="font-semibold text-lg leading-tight">Add this code to your Roblox bio</h2>
                <p className="text-xs text-slate-500 mt-0.5">Step 2 of 2 · Bio verification</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-5">
              Verifying as <span className="text-cyan-300 font-medium">{username}</span>. Copy the code, paste it into your Roblox profile bio, save it, then click Verify — we read your bio and confirm instantly.
            </p>

            {/* Code display */}
            <div className="rounded-xl bg-slate-950/60 border border-cyan-500/20 p-5 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Your verification code</div>
                <code className="font-mono text-2xl tracking-[0.3em] text-cyan-300 font-bold select-all">{code}</code>
              </div>
              <Button size="sm" variant="ghost" onClick={copyCode} className="text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 px-4 py-2.5">
                {copied ? <><Check className="h-4 w-4 mr-1.5 text-emerald-400" /> Copied</> : <><Copy className="h-4 w-4 mr-1.5" /> Copy</>}
              </Button>
            </div>

            {/* Steps */}
            <div className="mt-5 space-y-3">
              {[
                'Open your Roblox profile and edit your bio.',
                'Paste the code anywhere in the bio and save it.',
                'Click Verify — we read your bio and confirm it is you instantly.',
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="flex h-6 w-6 items-center justify-center text-xs font-bold rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shrink-0">{i + 1}</span>
                  {text}
                </div>
              ))}
            </div>

            {error && (
              <div className="mt-4 rounded-lg flex items-start gap-2 text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 p-3">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> <span>{error}</span>
              </div>
            )}

            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <Button
                onClick={verify}
                disabled={verifying}
                className="h-12 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-0"
              >
                {verifying ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying…</> : <><ShieldCheck className="h-4 w-4 mr-2" /> Verify my bio</>}
              </Button>
              <a href="https://www.roblox.com/users/#!/settings" target="_blank" rel="noreferrer">
                <Button variant="outline" className="w-full h-12 bg-white/5 border-white/15 text-white hover:bg-white/10 hover:text-white">
                  <ExternalLink className="h-4 w-4 mr-2" /> Open Roblox settings
                </Button>
              </a>
              <Button variant="ghost" onClick={reset} className="text-slate-300 hover:text-white hover:bg-white/10 h-12">
                <RefreshCw className="h-4 w-4 mr-1.5" /> Start over
              </Button>
            </div>
            <p className="mt-4 text-xs text-slate-500">You can remove the code from your bio once verification is complete.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}