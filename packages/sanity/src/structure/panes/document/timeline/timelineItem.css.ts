import {css} from '#styled-system/css'

export const avatarSize0Var = '--timeline-item-avatar-size-0'
export const textLineHeight0Var = '--timeline-item-text-line-height-0'

export const iconBox = css({
  boxShadow: '0 0 0 1px var(--card-bg-color)',
  position: 'absolute',
  width: `var(${avatarSize0Var})`,
  height: `var(${avatarSize0Var})`,
  right: '-3px',
  bottom: '-3px',
  borderRadius: '50%',
})

// `theme.color.avatar[<hue>].{fg,bg}`, read through the variables the nearest Card publishes.
// Each hue is spelled out, rather than mapped over, so the calls stay statically extractable.
export const iconBoxColor = {
  gray: css({
    '--card-icon-color': 'var(--card-avatar-gray-fg-color)',
    'backgroundColor': 'var(--card-avatar-gray-bg-color)',
  }),
  blue: css({
    '--card-icon-color': 'var(--card-avatar-blue-fg-color)',
    'backgroundColor': 'var(--card-avatar-blue-bg-color)',
  }),
  purple: css({
    '--card-icon-color': 'var(--card-avatar-purple-fg-color)',
    'backgroundColor': 'var(--card-avatar-purple-bg-color)',
  }),
  magenta: css({
    '--card-icon-color': 'var(--card-avatar-magenta-fg-color)',
    'backgroundColor': 'var(--card-avatar-magenta-bg-color)',
  }),
  red: css({
    '--card-icon-color': 'var(--card-avatar-red-fg-color)',
    'backgroundColor': 'var(--card-avatar-red-bg-color)',
  }),
  orange: css({
    '--card-icon-color': 'var(--card-avatar-orange-fg-color)',
    'backgroundColor': 'var(--card-avatar-orange-bg-color)',
  }),
  yellow: css({
    '--card-icon-color': 'var(--card-avatar-yellow-fg-color)',
    'backgroundColor': 'var(--card-avatar-yellow-bg-color)',
  }),
  green: css({
    '--card-icon-color': 'var(--card-avatar-green-fg-color)',
    'backgroundColor': 'var(--card-avatar-green-bg-color)',
  }),
  cyan: css({
    '--card-icon-color': 'var(--card-avatar-cyan-fg-color)',
    'backgroundColor': 'var(--card-avatar-cyan-bg-color)',
  }),
}

export const nameSkeleton = css({
  // `&&`: Skeleton is self-styled; `width`/`height` are among its own declarations.
  '&&': {
    width: '6ch',
    height: `var(${textLineHeight0Var})`,
  },
})
