import { useMemo } from 'react';

interface PixelAvatarProps {
  name: string;
  className?: string;
}

const HAIR_PALETTE = [
  ['#3b2f63', '#53438a'],
  ['#7c3d12', '#a85720'],
  ['#b45309', '#d97706'],
  ['#2d3748', '#4a5568'],
  ['#5b3a70', '#7e5299'],
  ['#9a6b10', '#c48f1d'],
];
const SKIN_PALETTE = [
  ['#f5cba7', '#dba67b'],
  ['#e0ac69', '#c28a48'],
  ['#c68642', '#a3682b'],
  ['#f8d9c0', '#deb597'],
];
const SHIRT_PALETTE = [
  ['#2b459e', '#4161cf'],
  ['#1f7a5c', '#2ea37c'],
  ['#9e3b3b', '#c75252'],
  ['#475569', '#64748b'],
  ['#8a5a19', '#b57824'],
];
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
 * Deterministic 16x16 16-bit RPG character portrait SVG with shading and outline.
 */
export function PixelAvatarSvg({ name, className }: PixelAvatarProps) {
  const p = useMemo(() => {
    const seed = hashString(name || 'Byakuya');
    const hair = HAIR_PALETTE[(seed >>> 3) % HAIR_PALETTE.length];
    const skin = SKIN_PALETTE[(seed >>> 6) % SKIN_PALETTE.length];
    const shirt = SHIRT_PALETTE[(seed >>> 9) % SHIRT_PALETTE.length];
    return {
      bg: BG_PALETTE[seed % BG_PALETTE.length],
      hairDark: hair[0],
      hairLight: hair[1],
      skin: skin[0],
      skinShade: skin[1],
      shirtDark: shirt[0],
      shirtLight: shirt[1],
      hasBeard: ((seed >>> 12) & 1) === 1,
    };
  }, [name]);

  return (
    <svg
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
    >
      <rect width="16" height="16" fill={p.bg} />
      {/* Subtle top-left background bevel */}
      <rect x="0" y="0" width="16" height="1" fill="#ffffff" opacity="0.1" />
      {/* Shoulders / tunic */}
      <rect x="2" y="12" width="12" height="4" fill="#0f172a" />
      <rect x="3" y="12" width="10" height="4" fill={p.shirtDark} />
      <rect x="4" y="12" width="8" height="2" fill={p.shirtLight} />
      <rect x="6" y="12" width="4" height="4" fill="#e2e8f0" opacity="0.2" />
      {/* Neck */}
      <rect x="6" y="11" width="4" height="1" fill={p.skinShade} />
      {/* Head outline */}
      <rect x="4" y="2" width="8" height="9" fill="#0f172a" />
      <rect x="3" y="4" width="10" height="6" fill="#0f172a" />
      {/* Face */}
      <rect x="4" y="4" width="8" height="7" fill={p.skin} />
      <rect x="4" y="10" width="8" height="1" fill={p.skinShade} />
      {/* Hair */}
      <rect x="4" y="2" width="8" height="2" fill={p.hairDark} />
      <rect x="5" y="2" width="5" height="1" fill={p.hairLight} />
      <rect x="3" y="3" width="2" height="5" fill={p.hairDark} />
      <rect x="11" y="3" width="2" height="5" fill={p.hairDark} />
      <rect x="5" y="4" width="4" height="1" fill={p.hairDark} />
      {/* Eyes */}
      <rect x="5" y="6" width="1" height="2" fill="#0f172a" />
      <rect x="10" y="6" width="1" height="2" fill="#0f172a" />
      <rect x="5" y="6" width="1" height="1" fill="#ffffff" opacity="0.6" />
      <rect x="10" y="6" width="1" height="1" fill="#ffffff" opacity="0.6" />
      {/* Mouth / beard */}
      {p.hasBeard ? (
        <rect x="5" y="9" width="6" height="2" fill={p.hairDark} />
      ) : (
        <rect x="7" y="9" width="2" height="1" fill="#a86844" />
      )}
    </svg>
  );
}
