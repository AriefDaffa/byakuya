'use client';

import { useState } from 'react';
import { UserMinus, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  addGroupMember,
  removeGroupMember,
  searchUsers,
} from '@/features/chat/actions';
import { cn } from '@/lib/utils';
import type { GroupMember } from '@/types/chat';
import type { Profile } from '@/types/database';

interface ReceiverProfileProps {
  avatar?: string;
  name?: string;
  email?: string;
  status?: string | null;
  isGroup?: boolean;
  conversationId?: string;
  members?: GroupMember[];
  currentUserId?: string | null;
  onMembersChanged?: () => void;
}

export function ReceiverProfile({
  avatar,
  name = '',
  email = '',
  status,
  isGroup = false,
  conversationId,
  members = [],
  currentUserId,
  onMembersChanged,
}: ReceiverProfileProps) {
  const isOnline = status?.toLowerCase() === 'online';
  const [searchTerm, setSearchTerm] = useState('');
  const [candidates, setCandidates] = useState<Profile[]>([]);

  const isAdmin = members.some(
    (m) => m.id === currentUserId && m.role === 'admin',
  );

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.trim().length < 2) {
      setCandidates([]);
      return;
    }
    const res = await searchUsers(term);
    if (res.data) {
      const existingIds = new Set(members.map((m) => m.id));
      setCandidates(res.data.filter((u) => !existingIds.has(u.id)));
    }
  };

  const handleAddMember = async (userId: string) => {
    if (!conversationId) return;
    const res = await addGroupMember(conversationId, userId);
    if ('error' in res && res.error) {
      toast.error(res.error);
      return;
    }
    toast.success('Member added');
    setSearchTerm('');
    setCandidates([]);
    onMembersChanged?.();
  };

  const handleRemoveMember = async (userId: string) => {
    if (!conversationId) return;
    const res = await removeGroupMember(conversationId, userId);
    if ('error' in res && res.error) {
      toast.error(res.error);
      return;
    }
    toast.success('Member removed');
    onMembersChanged?.();
  };

  return (
    <div className="flex size-full items-center justify-center overflow-y-auto p-4 sm:p-6">
      <div className="pixel-panel bg-card flex w-full max-w-sm flex-col items-center gap-4 rounded-none px-6 py-8 text-center">
        <Avatar className="size-28">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback className="font-pixel text-3xl font-bold">
            {name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="w-full space-y-1.5">
          <h2 className="font-pixel flex items-center justify-center gap-2 text-xl font-bold">
            {isGroup && <Users className="size-5 text-[var(--unread)]" />}
            {name}
          </h2>
          {email && (
            <p className="text-muted-foreground font-pixel-mono text-xs break-all">
              {email}
            </p>
          )}
          {!isGroup && status && (
            <span
              className={cn(
                'pixel-box mt-2 inline-flex items-center gap-1.5 px-2 py-1',
                isOnline ? 'bg-[var(--card)]' : 'bg-muted',
              )}
            >
              <span
                className={cn(
                  'size-2 border border-[var(--pixel-frame)]',
                  isOnline ? 'bg-[var(--online)]' : 'bg-muted-foreground',
                )}
                aria-hidden="true"
              />
              <span
                className={cn(
                  'font-pixel-mono text-[10px] font-bold',
                  isOnline ? 'text-[var(--online)]' : 'text-muted-foreground',
                )}
              >
                {status}
              </span>
            </span>
          )}
        </div>

        {isGroup && (
          <div className="w-full space-y-3 border-t-2 border-[#090c12] pt-4 text-left">
            <p className="text-muted-foreground font-mono text-xs font-bold uppercase">
              Members ({members.length})
            </p>
            <div className="max-h-48 space-y-1.5 overflow-y-auto">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between gap-2 border border-[#090c12] bg-background/40 px-2.5 py-1.5"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar className="size-7 shrink-0">
                      <AvatarImage src={member.avatar_url || ''} alt={member.name} />
                      <AvatarFallback>{member.name}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-sans text-xs font-semibold">
                        {member.name}
                      </p>
                      <p className="text-muted-foreground font-mono text-[10px] uppercase">
                        {member.role}
                      </p>
                    </div>
                  </div>
                  {(isAdmin || member.id === currentUserId) && (
                    <button
                      type="button"
                      onClick={() => void handleRemoveMember(member.id)}
                      className="pixel-btn bg-card text-destructive inline-flex size-7 shrink-0 items-center justify-center"
                      title={member.id === currentUserId ? 'Leave group' : 'Remove member'}
                      aria-label={`Remove ${member.name}`}
                    >
                      <UserMinus className="size-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {isAdmin && (
              <div className="space-y-1.5 pt-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => void handleSearch(e.target.value)}
                  placeholder="Add member by name..."
                  className="pixel-input h-9 w-full rounded-none px-2.5 font-sans text-xs outline-none"
                />
                {candidates.length > 0 && (
                  <div className="max-h-28 space-y-1 overflow-y-auto border border-[#090c12] p-1">
                    {candidates.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => void handleAddMember(u.id)}
                        className="hover:bg-accent flex w-full items-center justify-between px-2 py-1 text-left text-xs"
                      >
                        <span className="truncate">{u.name}</span>
                        <UserPlus className="size-3.5 shrink-0 text-[var(--unread)]" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
