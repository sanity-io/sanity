import {css} from '#styled-system/css'

// Theme values bridged from `useTheme_v2()` through the inline `style` of `tagInput.tsx`.

/** `${radius[1]}px` */
export const radius1Var = '--tag-input-radius-1'
/** `rem(space[1])` */
export const space1Var = '--tag-input-space-1'
/** `color.input.default.enabled.fg` */
export const enabledFgVar = '--tag-input-enabled-fg'
/** `focusRingBorderStyle({color: color.input.default.enabled.border, width: input.border.width})` */
export const enabledBoxShadowVar = '--tag-input-enabled-box-shadow'
/** `color.input.default.hovered.border` */
export const hoveredBorderColorVar = '--tag-input-hovered-border-color'
/** `focusRingStyle({border, focusRing})` for the focused state */
export const focusedBoxShadowVar = '--tag-input-focused-box-shadow'
/** `color.input.default.disabled.fg` */
export const disabledFgVar = '--tag-input-disabled-fg'
/** `color.input.default.disabled.bg` */
export const disabledBgVar = '--tag-input-disabled-bg'
/** `focusRingBorderStyle({color: color.input.default.disabled.border, width: input.border.width})` */
export const disabledBoxShadowVar = '--tag-input-disabled-box-shadow'

export const root = css({
  'position': 'relative',
  // `&&`: Card sets these declarations itself
  '&&': {
    borderRadius: `var(${radius1Var})`,
    color: `var(${enabledFgVar})`,
    boxShadow: `var(${enabledBoxShadowVar})`,
  },
  // enabled
  '&:not([data-read-only])': {
    cursor: 'text',
  },
  // focused
  '&:not([data-disabled]):not([data-read-only])[data-focused]': {
    boxShadow: `var(${focusedBoxShadowVar})`,
  },
  // disabled: `&&` keeps it ahead of the enabled `&&` rule without relying on source order
  '*:disabled + &&': {
    color: `var(${disabledFgVar})`,
    backgroundColor: `var(${disabledBgVar})`,
    boxShadow: `var(${disabledBoxShadowVar})`,
  },
  '@media (hover: hover)': {
    '&:not([data-disabled]):not([data-read-only]):hover': {
      borderColor: `var(${hoveredBorderColorVar})`,
    },
  },
})

/** The `> .content` element of the root */
export const content = css({
  position: 'relative',
  lineHeight: 0,
  margin: `calc(var(${space1Var}) * -1) 0 0 calc(var(${space1Var}) * -1)`,
})

/** The `> .content > div` elements of the root (tag boxes and the input wrapper) */
export const contentItem = css({
  // `&&&`: the tag Box (ui5) sets `display: block` through `.sui-display-block:not([hidden])`
  // (0,2,0); the original `& > .content > div` selector beat it with (0,3,0).
  '&&&': {
    display: 'inline-block',
    verticalAlign: 'top',
    padding: `var(${space1Var}) 0 0 var(${space1Var})`,
  },
})

/** `color.input.default.enabled.placeholder` */
export const placeholderFgVar = '--tag-input-placeholder-fg'

export const placeholder = css({
  'position': 'absolute',
  'top': 0,
  'left': 0,
  'right': 0,
  'pointerEvents': 'none',
  '--card-fg-color': `var(${placeholderFgVar})`,
})

export const tagBox = css({
  // This is needed to make textOverflow="ellipsis" work properly for the Text primitive
  maxWidth: '100%',
})

/** `rem(font.text.sizes[2].fontSize)` */
export const inputFontSizeVar = '--tag-input-font-size'
/** `size.lineHeight / size.fontSize` */
export const inputLineHeightVar = '--tag-input-line-height'
/** `font.text.family` */
export const inputFontFamilyVar = '--tag-input-font-family'
/** `font.text.weights.regular` */
export const inputFontWeightVar = '--tag-input-font-weight'
/** `rem(space[2] - size.ascenderHeight)` */
export const inputPaddingTopVar = '--tag-input-padding-top'
/** `rem(space[2])` */
export const inputPaddingXVar = '--tag-input-padding-x'
/** `rem(space[2] - size.descenderHeight)` */
export const inputPaddingBottomVar = '--tag-input-padding-bottom'
/** `color.input.default.enabled.fg` */
export const inputEnabledFgVar = '--tag-input-enabled-fg'
/** `color.input.default.disabled.fg` */
export const inputDisabledFgVar = '--tag-input-disabled-fg'

export const input = css({
  'appearance': 'none',
  'background': 'none',
  'border': 0,
  'borderRadius': 0,
  'outline': 'none',
  'fontSize': `var(${inputFontSizeVar})`,
  'lineHeight': `var(${inputLineHeightVar})`,
  'fontFamily': `var(${inputFontFamilyVar})`,
  'fontWeight': `var(${inputFontWeightVar})`,
  'margin': 0,
  'display': 'block',
  'minWidth': '1px',
  'maxWidth': '100%',
  'boxSizing': 'border-box',
  'paddingTop': `var(${inputPaddingTopVar})`,
  'paddingRight': `var(${inputPaddingXVar})`,
  'paddingBottom': `var(${inputPaddingBottomVar})`,
  'paddingLeft': `var(${inputPaddingXVar})`,
  // enabled
  '&:not(:invalid):not(:disabled)': {
    color: `var(${inputEnabledFgVar})`,
  },
  // disabled
  '&:not(:invalid):disabled': {
    color: `var(${inputDisabledFgVar})`,
  },
})
