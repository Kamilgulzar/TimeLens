export function GrainOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100]"
      style={{ opacity: 0.02, mixBlendMode: "multiply" }}
      aria-hidden
    >
      <svg width="100%" height="100%">
        <filter id="grain-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-noise)" />
      </svg>
    </div>
  );
}
