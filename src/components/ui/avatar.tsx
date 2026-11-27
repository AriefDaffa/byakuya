'use client';

import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@/lib/utils';
import { PixelAvatarSvg, PixelCustomAvatarSvg } from '@/components/ui/pixel-avatar';

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        'relative flex size-8 shrink-0 overflow-hidden rounded-none border-2 border-[var(--pixel-frame)] shadow-[2px_2px_0_var(--pixel-shadow)]',
        className,
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  src,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  if (typeof src === 'string' && src.startsWith('pixel:')) {
    return (
      <span
        data-slot="avatar-image"
        className={cn('aspect-square size-full overflow-hidden', className)}
      >
        <PixelCustomAvatarSvg pixelData={src} className="size-full" />
      </span>
    );
  }

  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      src={src}
      className={cn('aspect-square size-full object-cover', className)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  // Seed the portrait from the fallback label (normally the user's name) so
  // each person gets a stable 16-bit RPG portrait instead of a letter tile.
  const name = typeof children === 'string' ? children : 'Byakuya';

  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'bg-secondary text-secondary-foreground flex size-full items-center justify-center rounded-none',
        className,
      )}
      {...props}
    >
      <PixelAvatarSvg name={name} className="size-full" />
      <span className="sr-only">{name}</span>
    </AvatarPrimitive.Fallback>
  );
}

export { Avatar, AvatarImage, AvatarFallback };
