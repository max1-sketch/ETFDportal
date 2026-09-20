import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Image } from '@/components/ui/image';
import { ScrollText, ImageIcon, Inbox } from 'lucide-react';

export default function EvidenceDialog({ open, onClose, moderation }) {
  const type = moderation?.evidence_type;
  const hasChat = type === 'chat_log' && moderation?.evidence_text;
  const hasShot = type === 'screenshot' && moderation?.evidence_image_url;
  const hasAny = hasChat || hasShot;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-slate-950 border-white/15 text-white sm:max-w-lg">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
            {hasChat ? <ScrollText className="h-5 w-5 text-cyan-300" /> : <ImageIcon className="h-5 w-5 text-cyan-300" />}
          </div>
          <div>
            <DialogTitle className="text-lg">Evidence — {moderation?.moderation_type}</DialogTitle>
            <DialogDescription className="text-slate-400">{moderation?.reason}</DialogDescription>
          </div>
        </div>

        {hasChat && (
          <pre className="mt-4 text-xs font-mono text-slate-300 bg-slate-900/60 border border-white/10 rounded-lg p-4 whitespace-pre-wrap max-h-80 overflow-auto leading-relaxed">
            {moderation.evidence_text}
          </pre>
        )}

        {hasShot && (
          <div className="mt-4 rounded-lg overflow-hidden border border-white/10 bg-slate-900/40">
            <Image src={moderation.evidence_image_url} alt="Evidence screenshot" className="w-full" fittingType="fit" />
          </div>
        )}

        {!hasAny && (
          <div className="mt-4 flex items-center gap-2.5 text-sm text-slate-500 bg-white/[0.03] border border-white/10 rounded-lg p-4">
            <Inbox className="h-4 w-4" /> No evidence was attached to this moderation.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}