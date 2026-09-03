import {createVar, style} from '@vanilla-extract/css'

/**
 * Static counterparts of the style functions in `./styles`. Theme reads (`font.*`, `space[n]`,
 * `color.input.*`, `input.*`) are bridged through the `createVar()`s exported here; `./styles`
 * computes their values from the v2 theme and the wrappers set them with `assignInlineVars`.
 */

/**
 * Heavily based on the styling provided by Sanity UI.
 */
export const textInputRoot = style({
  alignItems: 'center',
  selectors: {
    '&:not([hidden])': {
      display: 'flex',
    },
  },
})

// `textInputBase` theme bridges
export const textInputFontFamilyVar = createVar()
export const textInputFontWeightVar = createVar()
export const inputEnabledFgVar = createVar()
export const inputEnabledPlaceholderVar = createVar()
export const inputDisabledFgVar = createVar()
export const inputDisabledPlaceholderVar = createVar()
export const inputInvalidEnabledFgVar = createVar()
export const inputInvalidEnabledPlaceholderVar = createVar()
export const inputReadOnlyFgVar = createVar()
export const inputReadOnlyPlaceholderVar = createVar()

/**
 * Heavily based on the styling provided by Sanity UI.
 */
export const textInputBase = style({
  appearance: 'none',
  background: 'none',
  border: 0,
  borderRadius: 0,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: textInputFontFamilyVar,
  fontWeight: textInputFontWeightVar,
  margin: 0,
  position: 'relative',
  zIndex: 1,
  display: 'block',
  color: 'var(--input-fg-color)',
  selectors: {
    /* NOTE: This is a hack to disable Chrome’s autofill styles */
    '&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus, &:-webkit-autofill:active':
      {
        WebkitTextFillColor: 'var(--input-fg-color) !important',
        transition: 'background-color 5000s',
        transitionDelay: '86400s' /* 24h */,
      },
    /* &:is(textarea) */
    "&[data-as='textarea']": {
      resize: 'none',
    },
    '&::placeholder': {
      color: 'var(--input-placeholder-color)',
    },
    // The wrapper always renders `data-scheme`/`data-tone` with the values the original selectors
    // matched on (`[data-scheme='${$scheme}'][data-tone='${$tone}']`), so presence checks are
    // equivalent and keep the same specificity.
    '&[data-scheme][data-tone]': {
      vars: {
        '--input-fg-color': inputEnabledFgVar,
        '--input-placeholder-color': inputEnabledPlaceholderVar,
      },
    },
    /* enabled */
    "&[data-scheme][data-tone]:not(:invalid):not(:disabled):not([data-read-only='true'])": {
      vars: {
        '--input-fg-color': inputEnabledFgVar,
        '--input-placeholder-color': inputEnabledPlaceholderVar,
      },
    },
    /* disabled */
    '&[data-scheme][data-tone]:not(:invalid):disabled': {
      vars: {
        '--input-fg-color': inputDisabledFgVar,
        '--input-placeholder-color': inputDisabledPlaceholderVar,
      },
    },
    /* invalid */
    '&[data-scheme][data-tone]:invalid': {
      vars: {
        '--input-fg-color': inputInvalidEnabledFgVar,
        '--input-placeholder-color': inputInvalidEnabledPlaceholderVar,
      },
    },
    /* readOnly */
    "&[data-scheme][data-tone][data-read-only='true']": {
      vars: {
        '--input-fg-color': inputReadOnlyFgVar,
        '--input-placeholder-color': inputReadOnlyPlaceholderVar,
      },
    },
  },
})

// `textInputRepresentation` theme bridges
export const inputEnabledBgVar = createVar()
export const inputEnabledBorderShadowVar = createVar()
export const inputInvalidEnabledBgVar = createVar()
export const inputInvalidEnabledBorderShadowVar = createVar()
export const inputDisabledBgVar = createVar()
export const inputDisabledBorderShadowVar = createVar()
export const inputInvalidDisabledBgVar = createVar()
export const inputInvalidDisabledFgVar = createVar()
export const inputInvalidDisabledBorderShadowVar = createVar()
export const inputReadOnlyBgVar = createVar()
export const inputInvalidReadOnlyBgVar = createVar()
export const inputInvalidReadOnlyFgVar = createVar()
export const inputHoveredBgVar = createVar()
export const inputHoveredFgVar = createVar()
export const inputHoveredBorderShadowVar = createVar()
export const inputInvalidHoveredBgVar = createVar()
export const inputInvalidHoveredFgVar = createVar()
export const inputInvalidHoveredBorderShadowVar = createVar()

/**
 * Heavily based on the styling provided by Sanity UI.
 *
 * Applied to a `Card`; the `$hasPrefix`/`$hasSuffix`/`$unstableDisableFocusRing` branches live in
 * the classes below so that an omitted branch emits no declaration, like the original.
 */
export const textInputRepresentation = style({
  'vars': {
    '--input-box-shadow': 'none',
  },
  'position': 'absolute',
  'top': 0,
  'left': 0,
  'right': 0,
  'bottom': 0,
  'display': 'block',
  'pointerEvents': 'none',
  'zIndex': 0,
  'selectors': {
    // `&&`: Card sets `background-color` (muted) and `box-shadow` (shadow prop) itself
    '&&': {
      backgroundColor: 'var(--card-bg-color)',
      boxShadow: 'var(--input-box-shadow)',
    },
    '&[data-scheme][data-tone]': {
      vars: {
        '--card-bg-color': inputEnabledBgVar,
        '--card-fg-color': inputEnabledFgVar,
      },
    },
    /* enabled */
    '*:not(:disabled) + &[data-scheme][data-tone][data-border]': {
      vars: {'--input-box-shadow': inputEnabledBorderShadowVar},
    },
    /* invalid */
    '*:not(:disabled).invalid + &[data-scheme][data-tone]': {
      vars: {
        '--card-bg-color': inputInvalidEnabledBgVar,
        '--card-fg-color': inputInvalidEnabledFgVar,
      },
    },
    '*:not(:disabled).invalid + &[data-scheme][data-tone][data-border]': {
      vars: {'--input-box-shadow': inputInvalidEnabledBorderShadowVar},
    },
    /* disabled */
    '*:not(.invalid):disabled + &[data-scheme][data-tone]': {
      vars: {
        '--card-bg-color': `${inputDisabledBgVar} !important`,
        '--card-fg-color': `${inputDisabledFgVar} !important`,
        '--card-icon-color': `${inputDisabledFgVar} !important`,
      },
    },
    '*:not(.invalid):disabled + &[data-scheme][data-tone][data-border]': {
      vars: {'--input-box-shadow': inputDisabledBorderShadowVar},
    },
    '*.invalid:disabled + &[data-scheme][data-tone]': {
      vars: {
        '--card-bg-color': `${inputInvalidDisabledBgVar} !important`,
        '--card-fg-color': `${inputInvalidDisabledFgVar} !important`,
        '--card-icon-color': `${inputInvalidDisabledFgVar} !important`,
      },
    },
    '*.invalid:disabled + &[data-scheme][data-tone][data-border]': {
      vars: {'--input-box-shadow': inputInvalidDisabledBorderShadowVar},
    },
    /* readOnly */
    "*:not(.invalid)[data-read-only='true'] + &[data-scheme][data-tone]": {
      vars: {
        '--card-bg-color': `${inputReadOnlyBgVar} !important`,
        '--card-fg-color': `${inputReadOnlyFgVar} !important`,
      },
    },
    "*.invalid[data-read-only='true'] + &[data-scheme][data-tone]": {
      vars: {
        '--card-bg-color': `${inputInvalidReadOnlyBgVar} !important`,
        '--card-fg-color': `${inputInvalidReadOnlyFgVar} !important`,
      },
    },
  },
  '@media': {
    '(hover: hover)': {
      selectors: {
        /* hovered */
        "*:not(:disabled):not([data-read-only='true']):not(.invalid):hover + &[data-scheme][data-tone]":
          {
            vars: {
              '--card-bg-color': inputHoveredBgVar,
              '--card-fg-color': inputHoveredFgVar,
            },
          },
        "*.invalid:not(:disabled):not([data-read-only='true']):hover + &[data-scheme][data-tone]": {
          vars: {
            '--card-bg-color': inputInvalidHoveredBgVar,
            '--card-fg-color': inputInvalidHoveredFgVar,
          },
        },
        "*:not(:disabled):not([data-read-only='true']):not(.invalid):not(:focus):hover + &[data-scheme][data-tone][data-border]":
          {
            vars: {'--input-box-shadow': inputHoveredBorderShadowVar},
          },
        "*.invalid:not(:disabled):not([data-read-only='true']):not(:focus):hover + &[data-scheme][data-tone][data-border]":
          {
            vars: {'--input-box-shadow': inputInvalidHoveredBorderShadowVar},
          },
      },
    },
  },
})

export const inputFocusBorderShadowVar = createVar()
export const inputFocusNoBorderShadowVar = createVar()

/**
 * The focused-state rules of `textInputRepresentation`, omitted when `$unstableDisableFocusRing`
 * is set. Defined after `textInputRepresentation` so that, at equal specificity (0,6,0), the focus
 * shadow keeps beating the invalid border shadow.
 */
export const textInputRepresentationFocusRing = style({
  selectors: {
    '*:not(:disabled):focus + &[data-scheme][data-tone][data-border]': {
      vars: {'--input-box-shadow': inputFocusBorderShadowVar},
    },
    '*:not(:disabled):focus + &[data-scheme][data-tone]:not([data-border])': {
      vars: {'--input-box-shadow': inputFocusNoBorderShadowVar},
    },
  },
})

/** `$hasPrefix`: `&&` because Card sets `border-radius` itself (radius prop) */
export const textInputRepresentationHasPrefix = style({
  selectors: {
    '&&': {
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
    },
  },
})

/** `$hasSuffix`: `&&` because Card sets `border-radius` itself (radius prop) */
export const textInputRepresentationHasSuffix = style({
  selectors: {
    '&&': {
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
    },
  },
})

// `responsiveInputPadding` theme bridges
export const inputPaddingTopVar = createVar()
export const inputPaddingRightVar = createVar()
export const inputPaddingBottomVar = createVar()
export const inputPaddingLeftVar = createVar()

/**
 * Heavily based on the styling provided by Sanity UI.
 */
export const responsiveInputPadding = style({
  paddingTop: inputPaddingTopVar,
  paddingRight: inputPaddingRightVar,
  paddingBottom: inputPaddingBottomVar,
  paddingLeft: inputPaddingLeftVar,
})

// `textInputFontSize` theme bridges
export const textInputFontSizeVar = createVar()
export const textInputLineHeightVar = createVar()

/**
 * Heavily based on the styling provided by Sanity UI.
 */
export const textInputFontSize = style({
  fontSize: textInputFontSizeVar,
  lineHeight: textInputLineHeightVar,
})

export const root = style({
  flex: 1,
  minWidth: 0,
  display: 'block',
  position: 'relative',
})
