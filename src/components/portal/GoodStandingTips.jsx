import { Heart, MessageSquareOff, Users, ShieldCheck, Bug } from 'lucide-react';

const TIPS = [
  { icon: Heart, text: 'Always respect other players — toxicity earns fast mutes.' },
  { icon: MessageSquareOff, text: 'Avoid spamming in chat — repeated messages trigger auto-mod.' },
  { icon: Users, text: 'Follow staff instructions — arguing with mods only makes things worse.' },
  { icon: ShieldCheck, text: 'No exploiting or glitching — fair play keeps the game fun for everyone.' },
  { icon: Bug, text: 'Report bugs, don\u2019t abuse them — bug abusers get banned too.' },
];

export default function GoodStandingTips() {
  return (
    <div className="mt-4 rounded-2xl bg-white/[0.03] border border-white/10 p-5">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck className="h-4 w-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-white">Ways to stay in Good Standing</h3>
      </div>
      <ul className="space-y-2.5">
        {TIPS.map((tip, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
            <tip.icon className="h-4 w-4 text-cyan-400/70 mt-0.5 shrink-0" />
            <span>{tip.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}