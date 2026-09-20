import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

export default function DeleteConfirmDialog({ moderation, open, onOpenChange, onConfirm, deleting }) {
  if (!moderation) return null;
  const isBan = moderation.moderation_type?.includes('Ban');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-slate-900 border-white/15 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Delete moderation record?</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-400">
            You are about to delete the <span className="text-cyan-300 font-medium">{moderation.moderation_type}</span> for{' '}
            <span className="text-white font-medium">{moderation.roblox_username}</span>.
            {isBan && ' This will also lift the in-game ban.'}
            {' '}This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-white/5 border-white/15 text-white hover:bg-white/10">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={deleting}
            className="bg-rose-600 text-white hover:bg-rose-500 border-0"
          >
            {deleting ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Deleting</> : 'Yes, delete it'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}