'use client';

import { useState } from 'react';
import { Check, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createGroupConversation, searchUsers } from '@/features/chat/actions';
import type { Profile } from '@/types/database';
import { cn } from '@/lib/utils';

interface CreateGroupDialogProps {
  onClose: () => void;
  onCreated: (conversationId: string) => void;
}

export function CreateGroupDialog({ onClose, onCreated }: CreateGroupDialogProps) {
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleSearch = async (term: string) => {
    setSearchQuery(term);
    if (term.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const res = await searchUsers(term);
    setIsSearching(false);
    if (res.data) {
      setSearchResults(res.data);
    }
  };

  const toggleMember = (user: Profile) => {
    setSelectedMembers((prev) =>
      prev.some((m) => m.id === user.id)
        ? prev.filter((m) => m.id !== user.id)
        : [...prev, user],
    );
  };

  const handleCreate = async () => {
    if (groupName.trim().length < 2) {
      toast.error('Group name must be at least 2 characters');
      return;
    }
    if (selectedMembers.length === 0) {
      toast.error('Select at least one member');
      return;
    }

    setIsCreating(true);
    const res = await createGroupConversation(
      groupName.trim(),
      selectedMembers.map((m) => m.id),
    );
    setIsCreating(false);

    if ('error' in res && res.error) {
      toast.error(res.error);
      return;
    }

    if ('conversationId' in res && res.conversationId) {
      toast.success(`Group "${groupName.trim()}" created!`);
      onCreated(res.conversationId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="pixel-panel bg-card text-foreground w-full max-w-md rounded-none p-4">
        <div className="mb-3 flex items-center justify-between border-b-2 border-[#090c12] pb-2">
          <h3 className="flex items-center gap-2 font-sans text-base font-bold uppercase">
            <Users className="size-4" /> New Group Room
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="pixel-btn bg-secondary text-secondary-foreground inline-flex size-8 items-center justify-center"
            aria-label="Close new group dialog"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-muted-foreground mb-1 block font-sans text-xs font-semibold uppercase">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Pixel Guild"
              className="pixel-input h-10 w-full rounded-none px-3 font-sans text-sm outline-none"
            />
          </div>

          <div>
            <label className="text-muted-foreground mb-1 block font-sans text-xs font-semibold uppercase">
              Add Members ({selectedMembers.length} selected)
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => void handleSearch(e.target.value)}
              placeholder="Search users by name or email..."
              className="pixel-input h-10 w-full rounded-none px-3 font-sans text-sm outline-none"
            />
          </div>

          {selectedMembers.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedMembers.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => toggleMember(member)}
                  className="pixel-box bg-secondary text-secondary-foreground inline-flex items-center gap-1 px-2 py-0.5 font-sans text-xs font-semibold"
                >
                  {member.name} <X className="size-3" />
                </button>
              ))}
            </div>
          )}

          <div className="max-h-44 overflow-y-auto border-2 border-[#090c12] bg-background/50">
            {isSearching ? (
              <p className="text-muted-foreground p-3 text-center font-sans text-xs">
                Searching...
              </p>
            ) : searchResults.length === 0 ? (
              <p className="text-muted-foreground p-3 text-center font-sans text-xs">
                {searchQuery.trim().length < 2
                  ? 'Type at least 2 characters to find users'
                  : 'No users found'}
              </p>
            ) : (
              searchResults.map((user) => {
                const selected = selectedMembers.some((m) => m.id === user.id);
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => toggleMember(user)}
                    className={cn(
                      'hover:bg-accent flex w-full items-center justify-between gap-2 border-b border-[#090c12]/40 px-3 py-2 text-left',
                      selected && 'bg-[#2c3766] text-[#f8fafc]',
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Avatar className="size-8 shrink-0">
                        <AvatarImage src={user.avatar_url || ''} alt={user.name} />
                        <AvatarFallback>{user.name}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-sans text-sm font-semibold">
                          {user.name}
                        </p>
                        <p className="truncate font-mono text-[11px] opacity-75">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    {selected && <Check className="size-4 shrink-0 text-[var(--unread)]" />}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2 border-t-2 border-[#090c12] pt-3">
          <button
            type="button"
            onClick={onClose}
            className="pixel-btn bg-secondary text-secondary-foreground px-3 py-1.5 font-sans text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={isCreating}
            className="pixel-btn bg-[var(--unread)] px-4 py-1.5 font-sans text-sm font-bold text-[#090c12] disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
}
