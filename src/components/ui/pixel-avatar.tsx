import { useMemo } from 'react';

interface PixelAvatarProps {
  name: string;
  className?: string;
}

const HAIR_PALETTE = ['#3b2f63', '#8b4513', '#c26b2a', '#2d3748', '#5b3a70', '#b8860b'];
const SKIN_PALETTE = ['#f5cba7', '#e0ac69', '#c68642', '#f8d9c0'];
const SHIRT_PALETTE = ['#2b459e', '#1f7a5c', '#9e3b3b', '#475569', '#8a5a19'];
const BG_PALETTE = ['#252d42', '#1f293d', '#2b3148', '#22333b'];

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Deterministic 12x12 16-bit RPG character portrait SVG seeded from the user's name.
 */
export function PixelAvatarSvg({ name, className }: PixelAvatarProps) {
  const palette = useMemo(() => {
    const seed = hashString(name || 'Byakuya');
    return {
      bg: BG_PALETTE[seed % BG_PALETTE.length],
      hair: HAIR_PALETTE[(seed >>> 3) % HAIR_PALETTE.length],
      skin: SKIN_PALETTE[(seed >>> 6) % SKIN_PALETTE.length],
      shirt: SHIRT_PALETTE[(seed >>> 9) % SHIRT_PALETTE.length],
      hasBeard: ((seed >>> 12) & 1) === 1,
    };
  }, [name]);

  return (
    <svg
      viewBox="0 0 12 12"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
    >
      {/* Background */}
      <rect width="12" height="12" fill={palette.bg} />
      {/* Shoulders / tunic */}
      <rect x="2" y="9" width="8" height="3" fill={palette.shirt} />
      <rect x="4" y="9" width="4" height="1" fill="#ffffff" opacity="0.2" />
      {/* Neck */}
      <rect x="5" y="8" width="2" height="1" fill={palette.skin} />
      {/* Face */}
      <rect x="3" y="3" width="6" height="5" fill={palette.skin} />
      {/* Hair */}
      <rect x="3" y="1" width="6" height="2" fill={palette.hair} />
      <rect x="2" y="2" width="1" height="4" fill={palette.hair} />
      <rect x="9" y="2" width="1" height="4" fill={palette.hair} />
      <rect x="4" y="3" width="2" height="1" fill={palette.hair} />
      {/* Eyes */}
      <rect x="4" y="5" width="1" height="1" fill="#0f172a" />
      <rect x="7" y="5" width="1" height="1" fill="#0f172a" />
      {/* Optional beard / mouth */}
      {palette.hasBeard ? (
        <rect x="4" y="7" width="4" height="1" fill={palette.hair} />
      ) : (
        <rect x="5" y="7" width="2" height="1" fill="#a86844" />
      )}
    </svg>
  );
}
