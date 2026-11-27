import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

export function PixelCrestIcon({
  className,
  monochrome = false,
  ...props
}: IconProps & { monochrome?: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect x="3" y="1" width="10" height="2" fill="currentColor" />
      <rect x="2" y="3" width="12" height="7" fill="currentColor" opacity="0.25" />
      <rect x="2" y="3" width="2" height="8" fill="currentColor" />
      <rect x="12" y="3" width="2" height="8" fill="currentColor" />
      <rect x="4" y="11" width="2" height="2" fill="currentColor" />
      <rect x="10" y="11" width="2" height="2" fill="currentColor" />
      <rect x="6" y="13" width="4" height="2" fill="currentColor" />
      <rect
        x="6"
        y="5"
        width="4"
        height="4"
        fill={monochrome ? 'currentColor' : '#22c55e'}
      />
    </svg>
  );
}

export function PixelSearchIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect x="4" y="2" width="5" height="2" />
      <rect x="2" y="4" width="2" height="5" />
      <rect x="9" y="4" width="2" height="5" />
      <rect x="4" y="9" width="5" height="2" />
      <rect x="9" y="9" width="2" height="2" />
      <rect x="11" y="11" width="2" height="2" />
      <rect x="13" y="13" width="2" height="2" />
    </svg>
  );
}

export function PixelMenuIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect x="2" y="3" width="12" height="2" />
      <rect x="2" y="7" width="12" height="2" />
      <rect x="2" y="11" width="12" height="2" />
    </svg>
  );
}

export function PixelSendIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect x="2" y="2" width="4" height="2" />
      <rect x="2" y="4" width="7" height="2" />
      <rect x="4" y="6" width="9" height="2" />
      <rect x="5" y="8" width="9" height="1" />
      <rect x="4" y="9" width="7" height="2" />
      <rect x="2" y="11" width="5" height="2" />
      <rect x="2" y="13" width="3" height="1" />
    </svg>
  );
}

export function PixelClipIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Diagonal 16-bit pixel paperclip */}
      <rect x="9" y="2" width="4" height="2" />
      <rect x="12" y="3" width="2" height="4" />
      <rect x="7" y="4" width="2" height="2" />
      <rect x="10" y="7" width="2" height="2" />
      <rect x="5" y="6" width="2" height="2" />
      <rect x="8" y="9" width="2" height="2" />
      <rect x="3" y="8" width="2" height="4" />
      <rect x="6" y="11" width="2" height="2" />
      <rect x="4" y="12" width="3" height="2" />
      <rect x="8" y="5" width="2" height="2" />
    </svg>
  );
}

export function PixelFileIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Ornate 16-bit pixel parchment scroll */}
      <rect x="2" y="1" width="11" height="3" fill="#0b0e14" />
      <rect x="3" y="2" width="9" height="1" fill="#d9a441" />
      <rect x="11" y="2" width="1" height="1" fill="#8f6319" />
      <rect x="2" y="4" width="1" height="8" fill="#0b0e14" />
      <rect x="12" y="4" width="1" height="8" fill="#0b0e14" />
      <rect x="3" y="4" width="9" height="8" fill="#f5e2b3" />
      <rect x="3" y="4" width="9" height="1" fill="#d4b16a" />
      <rect x="5" y="6" width="5" height="1" fill="#6b5128" />
      <rect x="5" y="8" width="5" height="1" fill="#6b5128" />
      <rect x="5" y="10" width="3" height="1" fill="#6b5128" />
      <rect x="3" y="12" width="11" height="3" fill="#0b0e14" />
      <rect x="4" y="13" width="9" height="1" fill="#d9a441" />
      <rect x="12" y="13" width="1" height="1" fill="#8f6319" />
    </svg>
  );
}

export function PixelAddContactIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect x="4" y="2" width="4" height="4" />
      <rect x="2" y="7" width="8" height="2" />
      <rect x="1" y="9" width="10" height="4" />
      <rect x="12" y="4" width="2" height="6" />
      <rect x="10" y="6" width="6" height="2" />
    </svg>
  );
}

export function PixelChatThreadIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect x="2" y="2" width="12" height="2" />
      <rect x="2" y="4" width="2" height="6" />
      <rect x="12" y="4" width="2" height="6" />
      <rect x="2" y="10" width="5" height="2" />
      <rect x="5" y="12" width="2" height="2" />
      <rect x="7" y="10" width="7" height="2" />
      <rect x="5" y="6" width="6" height="2" />
    </svg>
  );
}

export function PixelDownloadIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect x="7" y="2" width="2" height="7" />
      <rect x="4" y="7" width="8" height="2" />
      <rect x="6" y="9" width="4" height="2" />
      <rect x="3" y="12" width="10" height="2" />
    </svg>
  );
}

export function PixelBackIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect x="6" y="3" width="2" height="2" />
      <rect x="4" y="5" width="2" height="2" />
      <rect x="2" y="7" width="12" height="2" />
      <rect x="4" y="9" width="2" height="2" />
      <rect x="6" y="11" width="2" height="2" />
    </svg>
  );
}
