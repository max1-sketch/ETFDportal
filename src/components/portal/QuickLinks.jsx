import { MessageCircle, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DISCORD_URL = 'https://discord.gg/NCBqfpwPuT';
const GAME_URL = 'https://www.roblox.com/games/103398581793479/Escape-Tsunami-For-Developers';

export default function QuickLinks() {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <a href={DISCORD_URL} target="_blank" rel="noreferrer">
        <Button size="sm" className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white border-0">
          <MessageCircle className="h-4 w-4 mr-1.5" /> Join Discord
        </Button>
      </a>
      <a href={GAME_URL} target="_blank" rel="noreferrer">
        <Button size="sm" variant="outline" className="bg-white/5 border-white/15 text-white hover:bg-white/10 hover:text-white">
          <BookOpen className="h-4 w-4 mr-1.5" /> Game Page
        </Button>
      </a>
    </div>
  );
}