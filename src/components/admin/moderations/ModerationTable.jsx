import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import RobloxAvatar from '@/components/moderations/RobloxAvatar';
import { StatusBadge, TypeBadge } from '@/components/admin/moderations/ModerationBadges';
import UserInfoModal from '@/components/admin/UserInfoModal';

const PAGE_SIZE = 10;

function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ModerationTable({ items, onDelete }) {
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [items, currentPage]
  );

  if (items.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/10 overflow-x-auto">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="bg-white/[0.04] text-slate-400 text-xs uppercase tracking-wide border-b border-white/10">
            <th className="text-left font-semibold px-4 py-3.5">User</th>
            <th className="text-left font-semibold px-4 py-3.5">Type</th>
            <th className="text-left font-semibold px-4 py-3.5 min-w-[180px] max-w-[240px]">Reason</th>
            <th className="text-left font-semibold px-4 py-3.5 hidden md:table-cell whitespace-nowrap">Moderator</th>
            <th className="text-left font-semibold px-4 py-3.5 hidden lg:table-cell whitespace-nowrap">Date</th>
            <th className="text-left font-semibold px-4 py-3.5 whitespace-nowrap">Status</th>
            <th className="text-right font-semibold px-4 py-3.5 whitespace-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginated.map((m) => {
            const isLong = (m.reason || '').length > 60;
            const isExpanded = expanded === m.id;
            return (
              <tr key={m.id} className="border-t border-white/5 hover:bg-white/[0.03] transition-colors group">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <RobloxAvatar username={m.roblox_username} size={32} />
                    <button onClick={() => setSelectedUser(m.roblox_username)} className="text-cyan-300 font-medium hover:text-cyan-200 hover:underline">{m.roblox_username}</button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <TypeBadge type={m.moderation_type} />
                  {m.duration && <div className="text-[10px] text-slate-500 mt-1">{m.duration}</div>}
                </td>
                <td className="px-4 py-3 max-w-[240px]">
                  <div className={`text-slate-200 ${isExpanded ? 'whitespace-normal' : 'truncate'}`}>
                    {m.reason || '—'}
                  </div>
                  {m.details && isExpanded && (
                    <div className="text-xs text-slate-500 mt-1">{m.details}</div>
                  )}
                  {isLong && (
                    <button
                      onClick={() => setExpanded(isExpanded ? null : m.id)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 mt-0.5"
                    >
                      {isExpanded ? 'Show less' : 'View more'}
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-slate-400 whitespace-nowrap">
                  {m.staff_member || '—'}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-slate-400 whitespace-nowrap">
                  {formatDate(m.moderation_date)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={m.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onDelete(m)}
                    className="text-slate-500 hover:text-rose-300 hover:bg-rose-500/10 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 bg-white/[0.02]">
          <span className="text-xs text-slate-400">
            {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, items.length)} of {items.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              disabled={currentPage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 w-8 text-slate-400 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`h-8 min-w-8 px-2 rounded-md text-xs font-medium transition-colors ${
                  p === currentPage
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {p}
              </button>
            ))}
            <Button
              size="icon"
              variant="ghost"
              disabled={currentPage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 w-8 text-slate-400 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      <UserInfoModal robloxUsername={selectedUser} open={!!selectedUser} onClose={() => setSelectedUser(null)} />
    </div>
  );
}