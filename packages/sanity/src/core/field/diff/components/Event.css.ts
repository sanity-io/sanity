import {createVar, style, styleVariants} from '@vanilla-extract/css'

/** `theme.avatar.sizes[0].size` (px) */
export const avatarSize0Var = createVar()
/** `theme.avatar.sizes[1].size` (px) */
export const avatarSize1Var = createVar()
/** `theme.font.text.sizes[0].lineHeight` (px) */
export const textLineHeight0Var = createVar()

export const iconBox = style({
  boxShadow: '0 0 0 1px var(--card-bg-color)',
  position: 'absolute',
  width: avatarSize0Var,
  height: avatarSize0Var,
  right: '-3px',
  bottom: '-3px',
  borderRadius: '50%',
})

// `theme.color.avatar[<hue>].{fg,bg}`, read through the variables the nearest Card publishes.
export const iconBoxColor = styleVariants(
  {
    gray: 'gray',
    blue: 'blue',
    purple: 'purple',
    magenta: 'magenta',
    red: 'red',
    orange: 'orange',
    yellow: 'yellow',
    green: 'green',
    cyan: 'cyan',
  },
  (hue) => ({
    vars: {'--card-icon-color': `var(--card-avatar-${hue}-fg-color)`},
    backgroundColor: `var(--card-avatar-${hue}-bg-color)`,
  }),
)

export const avatarSkeleton = style({
  selectors: {
    // `&&`: Skeleton is self-styled; `border-radius`/`width`/`height` are among its own declarations.
    '&&': {
      borderRadius: '50%',
      width: avatarSize1Var,
      height: avatarSize1Var,
    },
  },
})

export const nameSkeleton = style({
  selectors: {
    // `&&`: Skeleton is self-styled; `width`/`height` are among its own declarations.
    '&&': {
      width: '6ch',
      height: textLineHeight0Var,
    },
  },
})
