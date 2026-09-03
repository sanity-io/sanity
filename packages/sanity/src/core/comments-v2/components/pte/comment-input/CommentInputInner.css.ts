import {createVar, style} from '@vanilla-extract/css'

// avatar.sizes[1].size
export const avatarSize1Var = createVar()
// radius[2]
export const radius2Var = createVar()
// input.border.width
export const inputBorderWidthVar = createVar()
// color.input.default.enabled.border
export const inputEnabledBorderColorVar = createVar()
// color.input.default.hovered.border
export const inputHoveredBorderColorVar = createVar()

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
    // Card sets border-radius (radius defaults to 0) and box-shadow on itself
    '&&': {
      borderRadius: radius2Var,
      boxShadow: 'var(--input-box-shadow)',
    },

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

export const actionsFlex = style({
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
  selectors: {
    // MenuDivider sets height on itself
    '&&': {
      height: '20px',
      width: '1px',
    },
  },
})

export const avatarContainer = style({
  minHeight: avatarSize1Var,
  display: 'flex',
  alignItems: 'center',
})
