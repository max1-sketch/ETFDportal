import { LifeBuoy, ExternalLink, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DISCORD_URL = 'https://discord.gg/NCBqfpwPuT';

export default function SupportCard() {
  return (
    <div className="mt-6 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950/40 border border-white/10 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
          <LifeBuoy className="h-5 w-5 text-cyan-300" />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold text-white">Need help with a moderation?</h2>
          <p className="mt-1 text-sm text-slate-400">
            Questions about a ban or an appeal? Join our Discord server and open a support ticket — a staff member will assist you.
          </p>
          <a href={DISCORD_URL} target="_blank" rel="noreferrer" className="inline-block mt-3">
            <Button
              size="sm"
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-0"
            >
              <MessageCircle className="h-4 w-4 mr-1.5" /> Join our Discord &amp; open a ticket <ExternalLink className="h-3.5 w-3.5 ml-1" />
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}