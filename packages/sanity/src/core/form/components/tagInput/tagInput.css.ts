import {createVar, style} from '@vanilla-extract/css'

// Theme values bridged from `useTheme_v2()` with `assignInlineVars` in `tagInput.tsx`.

/** `${radius[1]}px` */
export const radius1Var = createVar()
/** `rem(space[1])` */
export const space1Var = createVar()
/** `color.input.default.enabled.fg` */
export const enabledFgVar = createVar()
/** `focusRingBorderStyle({color: color.input.default.enabled.border, width: input.border.width})` */
export const enabledBoxShadowVar = createVar()
/** `focusRingStyle({border, focusRing})` for the focused state */
export const focusedBoxShadowVar = createVar()
/** `color.input.default.disabled.fg` */
export const disabledFgVar = createVar()
/** `color.input.default.disabled.bg` */
export const disabledBgVar = createVar()
/** `focusRingBorderStyle({color: color.input.default.disabled.border, width: input.border.width})` */
export const disabledBoxShadowVar = createVar()

export const root = style({
  position: 'relative',
  boxShadow: enabledBoxShadowVar,
  selectors: {
    // `&&`: Card sets `border-radius` (radius prop) and `color` itself
    '&&': {
      borderRadius: radius1Var,
      color: enabledFgVar,
    },

    // enabled
    '&:not([data-read-only])': {
      cursor: 'text',
    },

    // focused
    '&:not([data-disabled]):not([data-read-only])[data-focused]': {
      boxShadow: focusedBoxShadowVar,
    },

    // disabled (defined after `&&` so its equal-specificity `color` wins the tie)
    '*:disabled + &': {
      color: disabledFgVar,
      backgroundColor: disabledBgVar,
      boxShadow: disabledBoxShadowVar,
    },
  },
})

/** The `> .content` element of the root */
export const content = style({
  position: 'relative',
  lineHeight: 0,
  margin: `calc(${space1Var} * -1) 0 0 calc(${space1Var} * -1)`,
})

/** The `> .content > div` elements of the root (tag boxes and the input wrapper) */
export const contentItem = style({
  selectors: {
    // `&&&`: the tag Box (ui5) sets `display: block` through `.sui-display-block:not([hidden])`
    // (0,2,0); the original `& > .content > div` selector beat it with (0,3,0).
    '&&&': {
      display: 'inline-block',
      verticalAlign: 'top',
      padding: `${space1Var} 0 0 ${space1Var}`,
    },
  },
})

/** `color.input.default.enabled.placeholder` */
export const placeholderFgVar = createVar()

export const placeholder = style({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  pointerEvents: 'none',
  vars: {
    '--card-fg-color': placeholderFgVar,
  },
})

export const tagBox = style({
  // This is needed to make textOverflow="ellipsis" work properly for the Text primitive
  maxWidth: '100%',
})

/** `rem(font.text.sizes[2].fontSize)` */
export const inputFontSizeVar = createVar()
/** `size.lineHeight / size.fontSize` */
export const inputLineHeightVar = createVar()
/** `font.text.family` */
export const inputFontFamilyVar = createVar()
/** `font.text.weights.regular` */
export const inputFontWeightVar = createVar()
/** `rem(space[2] - size.ascenderHeight)` */
export const inputPaddingTopVar = createVar()
/** `rem(space[2])` */
export const inputPaddingXVar = createVar()
/** `rem(space[2] - size.descenderHeight)` */
export const inputPaddingBottomVar = createVar()
/** `color.input.default.enabled.fg` */
export const inputEnabledFgVar = createVar()
/** `color.input.default.disabled.fg` */
export const inputDisabledFgVar = createVar()

export const input = style({
  appearance: 'none',
  background: 'none',
  border: 0,
  borderRadius: 0,
  outline: 'none',
  fontSize: inputFontSizeVar,
  lineHeight: inputLineHeightVar,
  fontFamily: inputFontFamilyVar,
  fontWeight: inputFontWeightVar,
  margin: 0,
  display: 'block',
  minWidth: '1px',
  maxWidth: '100%',
  boxSizing: 'border-box',
  paddingTop: inputPaddingTopVar,
  paddingRight: inputPaddingXVar,
  paddingBottom: inputPaddingBottomVar,
  paddingLeft: inputPaddingXVar,
  selectors: {
    // enabled
    '&:not(:invalid):not(:disabled)': {
      color: inputEnabledFgVar,
    },

    // disabled
    '&:not(:invalid):disabled': {
      color: inputDisabledFgVar,
    },
  },
})
