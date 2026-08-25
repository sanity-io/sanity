/**
 * Workspace icon for the Metrics studio, drawn in the SanityMonogram's visual
 * language (flat #FF5500 square, near-black glyph, full-bleed — the studio's
 * WorkspacePreviewIcon container applies the corner rounding) but with a
 * health-pulse line instead of the "S", since the structure pane is literally
 * titled "Health metrics". Same-family-but-distinct, so it's recognizable as
 * a Sanity studio yet tells the workspaces apart at a glance.
 */
const SANITY_ORANGE = '#FF5500'
const SANITY_BLACK = '#0D0E12'

export function MetricsStudioIcon() {
  return (
    <svg
      data-sanity-icon="metrics-studio"
      viewBox="0 0 192 192"
      width="1em"
      height="1em"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="192" height="192" fill={SANITY_ORANGE} />
      <path
        d="M30 111h30l18-54 24 78 18-48 9 24h33"
        stroke={SANITY_BLACK}
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
