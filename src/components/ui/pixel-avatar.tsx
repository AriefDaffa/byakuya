import { useMemo } from 'react';

interface PixelAvatarProps {
  name: string;
  className?: string;
}

const HAIR_PALETTE = [
  ['#3b2f63', '#61509e'],
  ['#7c3d12', '#b55e24'],
  ['#a14d09', '#e0821f'],
  ['#283244', '#4d5c78'],
  ['#5b3a70', '#8c5ba8'],
  ['#8f6310', '#d19826'],
];
const SKIN_PALETTE = [
  ['#f7cfa9', '#d99e70'],
  ['#e3b074', '#be8345'],
  ['#c9894b', '#9e622b'],
  ['#fae0c8', '#d9ae8d'],
];
const SHIRT_PALETTE = [
  ['#2b459e', '#4b6ce0'],
  ['#1f7a5c', '#32b388'],
  ['#9e3b3b', '#cf5757'],
  ['#475569', '#6e8099'],
  ['#8a5a19', '#c28329'],
];
const BG_PALETTE = [
  ['#1d5b6e', '#28778f'],
  ['#1e526b', '#2b7091'],
  ['#225e63', '#2e7e85'],
  ['#274f70', '#356a96'],
];

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Deterministic 16x16 16-bit RPG character portrait SVG with teal frame,
 * shaded hair/skin/tunic, and expressive eyes.
 */
export function PixelAvatarSvg({ name, className }: PixelAvatarProps) {
  const p = useMemo(() => {
    const seed = hashString(name || 'Byakuya');
    const hair = HAIR_PALETTE[(seed >>> 3) % HAIR_PALETTE.length];
    const skin = SKIN_PALETTE[(seed >>> 6) % SKIN_PALETTE.length];
    const shirt = SHIRT_PALETTE[(seed >>> 9) % SHIRT_PALETTE.length];
    const bg = BG_PALETTE[seed % BG_PALETTE.length];
    return {
      bgDark: bg[0],
      bgLight: bg[1],
      hairDark: hair[0],
      hairLight: hair[1],
      skin: skin[0],
      skinShade: skin[1],
      shirtDark: shirt[0],
      shirtLight: shirt[1],
      hasBeard: ((seed >>> 12) & 1) === 1,
      hasCollar: ((seed >>> 13) & 1) === 1,
    };
  }, [name]);

  return (
    <svg
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
    >
      {/* Teal RPG portrait backdrop with subtle pixel vignette */}
      <rect width="16" height="16" fill={p.bgDark} />
      <rect x="1" y="1" width="14" height="10" fill={p.bgLight} />
      <rect x="0" y="0" width="16" height="1" fill="#8ce0f5" opacity="0.28" />
      <rect x="0" y="0" width="1" height="16" fill="#8ce0f5" opacity="0.18" />

      {/* Shoulders / RPG tunic */}
      <rect x="1" y="12" width="14" height="4" fill="#0b0e14" />
      <rect x="2" y="12" width="12" height="4" fill={p.shirtDark} />
      <rect x="3" y="12" width="10" height="2" fill={p.shirtLight} />
      {p.hasCollar ? (
        <>
          <rect x="5" y="12" width="2" height="2" fill="#e2e8f0" />
          <rect x="9" y="12" width="2" height="2" fill="#e2e8f0" />
          <rect x="7" y="13" width="2" height="3" fill="#0b0e14" opacity="0.35" />
        </>
      ) : (
        <rect x="6" y="12" width="4" height="4" fill="#e2e8f0" opacity="0.22" />
      )}

      {/* Neck & chin shadow */}
      <rect x="6" y="11" width="4" height="1" fill={p.skinShade} />

      {/* Head dark pixel outline */}
      <rect x="4" y="1" width="8" height="10" fill="#0b0e14" />
      <rect x="3" y="3" width="10" height="7" fill="#0b0e14" />

      {/* Ears */}
      <rect x="3" y="6" width="1" height="2" fill={p.skinShade} />
      <rect x="12" y="6" width="1" height="2" fill={p.skinShade} />

      {/* Face base + lower jaw shade */}
      <rect x="4" y="3" width="8" height="8" fill={p.skin} />
      <rect x="4" y="10" width="8" height="1" fill={p.skinShade} />
      <rect x="4" y="9" width="1" height="1" fill={p.skinShade} />
      <rect x="11" y="9" width="1" height="1" fill={p.skinShade} />

      {/* Hair crown + bangs + side locks */}
      <rect x="4" y="1" width="8" height="3" fill={p.hairDark} />
      <rect x="5" y="2" width="6" height="1" fill={p.hairLight} />
      <rect x="3" y="2" width="2" height="5" fill={p.hairDark} />
      <rect x="11" y="2" width="2" height="5" fill={p.hairDark} />
      <rect x="4" y="4" width="2" height="1" fill={p.hairDark} />
      <rect x="7" y="3" width="3" height="1" fill={p.hairLight} />

      {/* Eyes with white sclera & catchlight */}
      <rect x="5" y="6" width="2" height="2" fill="#f8fafc" />
      <rect x="9" y="6" width="2" height="2" fill="#f8fafc" />
      <rect x="6" y="6" width="1" height="2" fill="#0b0e14" />
      <rect x="10" y="6" width="1" height="2" fill="#0b0e14" />
      <rect x="6" y="6" width="1" height="1" fill="#ffffff" opacity="0.8" />
      <rect x="10" y="6" width="1" height="1" fill="#ffffff" opacity="0.8" />

      {/* Cheek blush / nose pixel */}
      <rect x="7" y="8" width="2" height="1" fill={p.skinShade} opacity="0.55" />

      {/* Mouth / beard */}
      {p.hasBeard ? (
        <>
          <rect x="5" y="9" width="6" height="2" fill={p.hairDark} />
          <rect x="7" y="9" width="2" height="1" fill={p.skin} />
        </>
      ) : (
        <rect x="7" y="9" width="2" height="1" fill="#9c5b3b" />
      )}
    </svg>
  );
}

/** 16-color 16-bit palette for custom user-painted 16x16 pixel avatars. */
export const PIXEL_AVATAR_PALETTE = [
  '#1d5b6e', // 0: Teal backdrop
  '#0b0e14', // 1: Ink black
  '#f8fafc', // 2: Pure white
  '#94a3b8', // 3: Slate silver
  '#f7cfa9', // 4: Light skin
  '#c9894b', // 5: Warm tan
  '#ef4444', // 6: Crimson red
  '#f97316', // 7: Flame orange
  '#eab308', // 8: Gold yellow
  '#22c55e', // 9: Emerald green
  '#06b6d4', // a: Cyan
  '#3b82f6', // b: Cobalt blue
  '#6366f1', // c: Indigo
  '#a855f7', // d: Royal purple
  '#ec4899', // e: Magenta pink
  '#78350f', // f: Oak brown
] as const;

export function PixelCustomAvatarSvg({
  pixelData,
  className,
}: {
  pixelData: string;
  className?: string;
}) {
  const grid = pixelData.startsWith('pixel:') ? pixelData.slice(6) : pixelData;

  return (
    <svg
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
    >
      <rect width="16" height="16" fill={PIXEL_AVATAR_PALETTE[0]} />
      {Array.from({ length: Math.min(grid.length, 256) }, (_, idx) => {
        const ch = grid[idx];
        const colorIndex = parseInt(ch, 16);
        if (Number.isNaN(colorIndex) || colorIndex === 0) return null;
        const fill = PIXEL_AVATAR_PALETTE[colorIndex];
        if (!fill) return null;
        const x = idx % 16;
        const y = Math.floor(idx / 16);
        return <rect key={idx} x={x} y={y} width="1" height="1" fill={fill} />;
      })}
    </svg>
  );
}
