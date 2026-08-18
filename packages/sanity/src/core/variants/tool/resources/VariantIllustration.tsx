/**
 * Isometric illustration: one primary document with smaller derived copies,
 * echoing the layered panels used in {@link ReleaseIllustration}.
 */
const BASE_PANEL =
  'M64 150.174V81.8262C64 79.1748 65.498 76.751 67.8695 75.5653L103.87 57.5652C108.524 55.2381 114 58.6226 114 63.8262V132.174C114 134.825 112.502 137.249 110.131 138.435L74.1305 156.435C69.4762 158.762 64 155.377 64 150.174Z'

/** Horizontal “body copy” lines in panel local coordinates */
const LINES_FULL = ['M72 86 L106 86', 'M72 96 L102 96', 'M72 106 L104 106', 'M72 116 L98 116']

const LINES_MEDIUM = ['M72 88 L100 88', 'M72 98 L96 98', 'M72 108 L102 108']

const LINES_SHORT = ['M72 90 L94 90', 'M72 100 L92 100']

export const VariantIllustration = () => (
  <svg
    aria-hidden="true"
    data-testid="variant-illustration"
    width="248"
    height="201"
    viewBox="0 0 248 201"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* faint depth behind hub */}
    <g opacity={0.12}>
      <path
        d={BASE_PANEL}
        fill="var(--card-muted-bg-color)"
        stroke="var(--card-muted-fg-color)"
        strokeWidth={1.2}
        transform="translate(12 10)"
      />
      <path
        d={BASE_PANEL}
        fill="var(--card-muted-bg-color)"
        stroke="var(--card-muted-fg-color)"
        strokeWidth={1.2}
        transform="translate(6 6)"
      />
    </g>

    {/* derived copies — same silhouette, different inner lines */}
    <g opacity={0.28}>
      <g transform="translate(118 6) scale(0.5)">
        <path
          d={BASE_PANEL}
          fill="var(--card-muted-bg-color)"
          stroke="var(--card-muted-fg-color)"
          strokeWidth={1.2}
        />
        {LINES_MEDIUM.map((d) => (
          <path
            key={d}
            d={d}
            stroke="var(--card-muted-fg-color)"
            strokeWidth={1.2}
            strokeLinecap="round"
            opacity={0.55}
          />
        ))}
      </g>
    </g>

    <g opacity={0.34}>
      <g transform="translate(126 52) scale(0.52)">
        <path
          d={BASE_PANEL}
          fill="var(--card-muted-bg-color)"
          stroke="var(--card-muted-fg-color)"
          strokeWidth={1.2}
        />
        {LINES_FULL.slice(0, 3).map((d) => (
          <path
            key={d}
            d={d}
            stroke="var(--card-muted-fg-color)"
            strokeWidth={1.2}
            strokeLinecap="round"
            opacity={0.5}
          />
        ))}
      </g>
    </g>

    <g opacity={0.26}>
      <g transform="translate(106 102) scale(0.48)">
        <path
          d={BASE_PANEL}
          fill="var(--card-muted-bg-color)"
          stroke="var(--card-muted-fg-color)"
          strokeWidth={1.2}
        />
        {LINES_SHORT.map((d) => (
          <path
            key={d}
            d={d}
            stroke="var(--card-muted-fg-color)"
            strokeWidth={1.2}
            strokeLinecap="round"
            opacity={0.55}
          />
        ))}
      </g>
    </g>

    {/* soft connectors — hub to satellites */}
    <g opacity={0.14} stroke="var(--card-muted-fg-color)" strokeWidth={1.2} strokeLinecap="round">
      <path d="M118 112 Q 152 72 168 58" fill="none" />
      <path d="M124 124 Q 168 108 188 92" fill="none" />
      <path d="M118 138 Q 150 152 162 168" fill="none" />
    </g>

    {/* primary document */}
    <g transform="translate(26 20) scale(1.06)">
      <path
        d={BASE_PANEL}
        fill="var(--card-muted-bg-color)"
        stroke="var(--card-muted-fg-color)"
        strokeWidth={1.2}
        opacity={0.92}
      />
      {LINES_FULL.map((d, index) => (
        <path
          key={d}
          d={d}
          stroke="var(--card-muted-fg-color)"
          strokeWidth={1.2}
          strokeLinecap="round"
          opacity={0.42 + index * 0.06}
        />
      ))}
    </g>
  </svg>
)
