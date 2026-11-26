'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface SheetOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  header?: ReactNode;
}

/**
 * Accessible slide-over panel built on Radix Dialog.
 * Radix handles the focus trap, focus restoration, Escape-to-close and body
 * scroll locking. Don't reimplement those behaviours with plain divs.
 */
export function SheetOverlay({
  isOpen,
  onClose,
  children,
  title,
  header,
}: SheetOverlayProps) {
  const accessibleTitle = title || 'Sheet';

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="bg-background fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col shadow-xl focus:outline-none"
        >
          <div className="flex items-center justify-between gap-2 border-b p-2">
            {header || (
              <Dialog.Title className="px-2 text-lg font-semibold">
                {accessibleTitle}
              </Dialog.Title>
            )}
            {header && <Dialog.Title className="sr-only">{accessibleTitle}</Dialog.Title>}
            <Dialog.Close asChild>
              <button
                type="button"
                className="hover:bg-accent inline-flex size-8 shrink-0 items-center justify-center rounded-md"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
