import {createVar, style} from '@vanilla-extract/css'

/** `radius[2]` */
export const radius2Var = createVar()
/** `input.border.width` (px) */
export const inputBorderWidthVar = createVar()
/** `color.input.default.enabled.border` */
export const inputEnabledBorderColorVar = createVar()
/** `color.input.default.hovered.border` */
export const inputHoveredBorderColorVar = createVar()
/** `avatar.sizes[1].size` */
export const avatarSize1Var = createVar()

function focusRingBorderStyle(border: {color: string; width: string}): string {
  return `inset 0 0 0 ${border.width} ${border.color}`
}

export const rootCard = style({
  vars: {
    '--input-box-shadow': focusRingBorderStyle({
      color: inputEnabledBorderColorVar,
      width: inputBorderWidthVar,
    }),
  },

  selectors: {
    // `&&` beats Card's own `border-radius` (radius defaults to 0) and `box-shadow`
    '&&': {
      borderRadius: radius2Var,
      boxShadow: 'var(--input-box-shadow)',
    },

    // `&&` keeps this rule above the `&&` root rule, as the original (0,2,0) sat above its (0,1,0) root
    "&&:not([data-expand-on-focus='false'], :focus-within)": {
      background: 'transparent',
      boxShadow: 'unset',
    },

    "&[data-focused='true']:focus-within": {
      vars: {
        /* box-shadow: inset 0 0 0 1px var(--card-focus-ring-color); */
        '--input-box-shadow': focusRingBorderStyle({
          color: 'var(--card-focus-ring-color)',
          width: inputBorderWidthVar,
        }),
      },
    },

    '&:hover': {
      vars: {
        '--input-box-shadow': focusRingBorderStyle({
          color: inputHoveredBorderColorVar,
          width: inputBorderWidthVar,
        }),
      },
    },
  },
})

export const editableWrap = style({
  maxHeight: '20vh',
  overflowY: 'auto',

  // (0,3,0)+ beats ui5 Box's default `minHeight="0"` (`.sui-min-height`, (0,1,0))
  selectors: {
    [`${rootCard}[data-focused='true']:focus-within &`]: {
      minHeight: '1em',
    },

    [`${rootCard}:focus-within &`]: {
      minHeight: '1em',
    },

    [`${rootCard}[data-expand-on-focus='false'] &`]: {
      minHeight: '1em',
    },
  },
})

// Both selectors are (0,4,0); the `:focus-within` one is emitted last so it wins, as in the original
export const commentInputActions = style({
  selectors: {
    [`${rootCard}[data-expand-on-focus='true'] &:not([hidden])`]: {
      display: 'none',
    },

    [`${rootCard}[data-expand-on-focus='true']:focus-within &`]: {
      display: 'flex',
    },
  },
})

export const buttonDivider = style({
  width: '1px',
  selectors: {
    // `&&` beats MenuDivider's own `height: 1px`
    '&&': {
      height: '20px',
    },
  },
})

export const avatarContainer = style({
  minHeight: avatarSize1Var,
  display: 'flex',
  alignItems: 'center',
})
