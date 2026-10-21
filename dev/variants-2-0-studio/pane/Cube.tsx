import {type StateTone} from './stateTone'

/**
 * The cube (P2, N2). Following global: an outline in the state colour, white faces. Local: the same shape filled in, the top face solid in the state colour
 * and the two lower faces a light tint of it. Same shape in both; no dashes, no lid.
 */
export function CubeIcon({
  tone,
  filled = false,
  size = 24,
}: {
  tone: StateTone
  filled?: boolean
  size?: number
}) {
  const edge = {stroke: tone.icon, strokeLinejoin: 'round' as const, strokeWidth: 1.7}
  return (
    <svg
      aria-hidden="true"
      data-cube={filled ? 'local' : 'global'}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path
        d="M3.5 7.25 12 12v9.5l-8.5-4.75v-9.5Z"
        fill={filled ? tone.tint : 'var(--card-bg-color)'}
        {...edge}
      />
      <path
        d="M12 12l8.5-4.75v9.5L12 21.5V12Z"
        fill={filled ? tone.tint : 'var(--card-bg-color)'}
        {...edge}
      />
      <path
        d="M12 2.5 20.5 7.25 12 12 3.5 7.25 12 2.5Z"
        fill={filled ? tone.icon : 'var(--card-bg-color)'}
        {...edge}
      />
    </svg>
  )
}
