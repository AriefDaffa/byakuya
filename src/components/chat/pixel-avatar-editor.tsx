'use client';

import { useCallback, useState } from 'react';
import { Eraser, RotateCcw, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  PIXEL_AVATAR_PALETTE,
  PixelCustomAvatarSvg,
} from '@/components/ui/pixel-avatar';
import { updatePixelAvatar } from '@/features/auth/actions';
import { cn } from '@/lib/utils';

interface PixelAvatarEditorProps {
  initialAvatarUrl?: string | null;
  onClose: () => void;
  onSaved: (newAvatarUrl: string) => void;
}

const DEFAULT_GRID = '0'.repeat(256);

function parseInitialGrid(avatarUrl?: string | null): string[] {
  if (avatarUrl && /^pixel:[0-9a-z]{256}$/.test(avatarUrl)) {
    return avatarUrl.slice(6).split('');
  }
  return DEFAULT_GRID.split('');
}

export function PixelAvatarEditor({
  initialAvatarUrl,
  onClose,
  onSaved,
}: PixelAvatarEditorProps) {
  const [pixels, setPixels] = useState<string[]>(() =>
    parseInitialGrid(initialAvatarUrl),
  );
  const [selectedColor, setSelectedColor] = useState<number>(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const paintCell = useCallback(
    (index: number, colorIdx: number) => {
      const hex = colorIdx.toString(16);
      setPixels((prev) => {
        if (prev[index] === hex) return prev;
        const next = [...prev];
        next[index] = hex;
        return next;
      });
    },
    [],
  );

  const handleClear = () => {
    setPixels(DEFAULT_GRID.split(''));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const payload = `pixel:${pixels.join('')}`;
    const result = await updatePixelAvatar(payload);
    setIsSaving(false);

    if (!result.success) {
      toast.error(result.error || 'Failed to save avatar');
      return;
    }

    toast.success('Pixel avatar updated!');
    onSaved(payload);
    onClose();
  };

  const previewString = `pixel:${pixels.join('')}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      onMouseUp={() => setIsDrawing(false)}
    >
      <div className="pixel-panel bg-card text-foreground w-full max-w-md rounded-none p-4">
        <div className="mb-3 flex items-center justify-between border-b-2 border-[#090c12] pb-2">
          <h3 className="font-sans text-base font-bold tracking-wide uppercase">
            16×16 Pixel Avatar Painter
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="pixel-btn bg-secondary text-secondary-foreground inline-flex size-8 items-center justify-center"
            aria-label="Close avatar painter"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          {/* 16x16 Interactive Canvas */}
          <div
            className="grid shrink-0 grid-cols-16 border-2 border-[#090c12] bg-[#1d5b6e] shadow-[3px_3px_0_#07090e] select-none"
            style={{ width: 224, height: 224 }}
            onMouseLeave={() => setIsDrawing(false)}
          >
            {pixels.map((hex, index) => {
              const colorIdx = parseInt(hex, 16) || 0;
              const bg = PIXEL_AVATAR_PALETTE[colorIdx] ?? PIXEL_AVATAR_PALETTE[0];
              return (
                <button
                  key={index}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsDrawing(true);
                    paintCell(index, selectedColor);
                  }}
                  onMouseEnter={() => {
                    if (isDrawing) paintCell(index, selectedColor);
                  }}
                  style={{ backgroundColor: bg }}
                  className="size-[13.75px] border-[0.5px] border-black/15 p-0 focus:outline-none"
                  aria-label={`Pixel ${index % 16}, ${Math.floor(index / 16)}`}
                />
              );
            })}
          </div>

          {/* Palette & Live Preview */}
          <div className="flex flex-1 flex-col justify-between gap-3">
            <div>
              <p className="text-muted-foreground mb-1.5 font-sans text-xs font-semibold uppercase">
                Preview
              </p>
              <div className="inline-block size-16 border-2 border-[#090c12] shadow-[2px_2px_0_#07090e]">
                <PixelCustomAvatarSvg pixelData={previewString} className="size-full" />
              </div>
            </div>

            <div>
              <p className="text-muted-foreground mb-1.5 font-sans text-xs font-semibold uppercase">
                16-Color Palette
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {PIXEL_AVATAR_PALETTE.map((color, idx) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(idx)}
                    style={{ backgroundColor: color }}
                    className={cn(
                      'size-7 border-2 border-[#090c12] transition-transform',
                      selectedColor === idx && 'scale-110 ring-2 ring-[var(--unread)]',
                    )}
                    aria-label={`Select color ${idx}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedColor(0)}
                className={cn(
                  'pixel-btn bg-secondary text-secondary-foreground inline-flex flex-1 items-center justify-center gap-1 px-2 py-1.5 font-sans text-xs font-semibold',
                  selectedColor === 0 && 'ring-2 ring-[var(--unread)]',
                )}
              >
                <Eraser className="size-3.5" /> Erase
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="pixel-btn bg-secondary text-secondary-foreground inline-flex flex-1 items-center justify-center gap-1 px-2 py-1.5 font-sans text-xs font-semibold"
              >
                <RotateCcw className="size-3.5" /> Clear
              </button>
            </div>
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
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="pixel-btn bg-[var(--unread)] px-4 py-1.5 font-sans text-sm font-bold text-[#090c12] disabled:opacity-50"
          >
            <span className="inline-flex items-center gap-1.5">
              <Save className="size-4" />
              {isSaving ? 'Saving...' : 'Save Avatar'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
