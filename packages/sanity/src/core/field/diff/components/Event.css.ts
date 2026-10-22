import {css} from '#styled-system/css'

/** `theme.avatar.sizes[0].size` (px) */
export const avatarSize0Var = '--event-avatar-size-0'
/** `theme.avatar.sizes[1].size` (px) */
export const avatarSize1Var = '--event-avatar-size-1'
/** `theme.font.text.sizes[0].lineHeight` (px) */
export const textLineHeight0Var = '--event-text-line-height-0'

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
// ui5 `Icon` re-declares `--icon-color` on its svg, shadowing the `--card-icon-color` set here.
// Each hue is spelled out, rather than mapped over, so the calls stay statically extractable.
export const iconBoxColor = {
  gray: css({
    '--card-icon-color': 'var(--card-avatar-gray-fg-color)',
    'backgroundColor': 'var(--card-avatar-gray-bg-color)',
    '& svg': {
      '--icon-color': 'var(--card-avatar-gray-fg-color)',
    },
  }),
  blue: css({
    '--card-icon-color': 'var(--card-avatar-blue-fg-color)',
    'backgroundColor': 'var(--card-avatar-blue-bg-color)',
    '& svg': {
      '--icon-color': 'var(--card-avatar-blue-fg-color)',
    },
  }),
  purple: css({
    '--card-icon-color': 'var(--card-avatar-purple-fg-color)',
    'backgroundColor': 'var(--card-avatar-purple-bg-color)',
    '& svg': {
      '--icon-color': 'var(--card-avatar-purple-fg-color)',
    },
  }),
  magenta: css({
    '--card-icon-color': 'var(--card-avatar-magenta-fg-color)',
    'backgroundColor': 'var(--card-avatar-magenta-bg-color)',
    '& svg': {
      '--icon-color': 'var(--card-avatar-magenta-fg-color)',
    },
  }),
  red: css({
    '--card-icon-color': 'var(--card-avatar-red-fg-color)',
    'backgroundColor': 'var(--card-avatar-red-bg-color)',
    '& svg': {
      '--icon-color': 'var(--card-avatar-red-fg-color)',
    },
  }),
  orange: css({
    '--card-icon-color': 'var(--card-avatar-orange-fg-color)',
    'backgroundColor': 'var(--card-avatar-orange-bg-color)',
    '& svg': {
      '--icon-color': 'var(--card-avatar-orange-fg-color)',
    },
  }),
  yellow: css({
    '--card-icon-color': 'var(--card-avatar-yellow-fg-color)',
    'backgroundColor': 'var(--card-avatar-yellow-bg-color)',
    '& svg': {
      '--icon-color': 'var(--card-avatar-yellow-fg-color)',
    },
  }),
  green: css({
    '--card-icon-color': 'var(--card-avatar-green-fg-color)',
    'backgroundColor': 'var(--card-avatar-green-bg-color)',
    '& svg': {
      '--icon-color': 'var(--card-avatar-green-fg-color)',
    },
  }),
  cyan: css({
    '--card-icon-color': 'var(--card-avatar-cyan-fg-color)',
    'backgroundColor': 'var(--card-avatar-cyan-bg-color)',
    '& svg': {
      '--icon-color': 'var(--card-avatar-cyan-fg-color)',
    },
  }),
}

export const avatarSkeleton = css({
  // `&&`: Skeleton is self-styled; `border-radius`/`width`/`height` are among its own declarations.
  '&&': {
    borderRadius: '50%',
    width: `var(${avatarSize1Var})`,
    height: `var(${avatarSize1Var})`,
  },
})

export const nameSkeleton = css({
  // `&&`: Skeleton is self-styled; `width`/`height` are among its own declarations.
  '&&': {
    width: '6ch',
    height: `var(${textLineHeight0Var})`,
  },
})
