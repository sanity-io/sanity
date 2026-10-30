import {css} from '#styled-system/css'

// avatar.sizes[1].size
export const avatarSize1Var = '--comment-input-inner-avatar-size-1'
// radius[2]
export const radius2Var = '--comment-input-inner-radius-2'
// input.border.width
export const inputBorderWidthVar = '--comment-input-inner-input-border-width'
// color.input.default.enabled.border
export const inputEnabledBorderColorVar = '--comment-input-inner-input-enabled-border-color'
// color.input.default.hovered.border
export const inputHoveredBorderColorVar = '--comment-input-inner-input-hovered-border-color'

export const rootCard = css({
  '--input-box-shadow': `inset 0 0 0 var(${inputBorderWidthVar}) var(${inputEnabledBorderColorVar})`,
  // Card sets border-radius (radius defaults to 0) and box-shadow on itself
  '&&': {
    borderRadius: `var(${radius2Var})`,
    boxShadow: 'var(--input-box-shadow)',
  },
  "&&:not([data-expand-on-focus='false'], :focus-within)": {
    background: 'transparent',
    boxShadow: 'unset',
  },
  "&[data-focused='true']:focus-within": {
    /* box-shadow: inset 0 0 0 1px var(--card-focus-ring-color); */
    '--input-box-shadow': `inset 0 0 0 var(${inputBorderWidthVar}) var(--card-focus-ring-color)`,
  },
  '&:hover': {
    '--input-box-shadow': `inset 0 0 0 var(${inputBorderWidthVar}) var(${inputHoveredBorderColorVar})`,
  },
})

// `data-comment-input-inner` is rendered by the element with the `rootCard` class
export const editableWrap = css({
  'maxHeight': '20vh',
  'overflowY': 'auto',
  "[data-comment-input-inner][data-focused='true']:focus-within &": {
    minHeight: '1em',
  },
  '[data-comment-input-inner]:focus-within &': {
    minHeight: '1em',
  },
  "[data-comment-input-inner][data-expand-on-focus='false'] &": {
    minHeight: '1em',
  },
})

// The actions of an input that expands on focus only show while it has focus
export const actionsFlex = css({
  "[data-comment-input-inner][data-expand-on-focus='true']:not(:focus-within) &": {
    '&:not([hidden])': {
      display: 'none',
    },
  },
  "[data-comment-input-inner][data-expand-on-focus='true']:focus-within &": {
    display: 'flex',
  },
})

export const buttonDivider = css({
  // MenuDivider sets height on itself
  '&&': {
    height: '20px',
    width: '1px',
  },
})

export const avatarContainer = css({
  minHeight: `var(${avatarSize1Var})`,
  display: 'flex',
  alignItems: 'center',
})
