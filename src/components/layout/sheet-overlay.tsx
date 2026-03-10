'use client';

import type { ReactNode } from 'react';

interface SheetOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  header?: ReactNode;
}

export function SheetOverlay({
  isOpen,
  onClose,
  children,
  title,
  header,
}: SheetOverlayProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Sheet */}
      <div
        className="bg-background fixed inset-y-0 right-0 z-50 w-full max-w-md shadow-xl transition-transform"
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Sheet'}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-2">
            {header || <h2 className="px-2 text-lg font-semibold">{title}</h2>}
            <button
              type="button"
              onClick={onClose}
              className="hover:bg-accent inline-flex size-8 items-center justify-center rounded-md"
              aria-label="Close"
            >
              <span className="text-lg">&times;</span>
            </button>
          </div>
          {/* Content */}
          <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
      </div>
    </>
  );
}
