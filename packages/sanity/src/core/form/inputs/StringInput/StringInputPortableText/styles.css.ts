import {css} from '#styled-system/css'

/**
 * Static counterparts of the style functions in `./styles`. Theme reads (`font.*`, `space[n]`,
 * `color.input.*`, `input.*`) are bridged through the custom properties exported here; `./styles`
 * computes their values from the v2 theme and the wrappers set them inline.
 */

/**
 * Heavily based on the styling provided by Sanity UI.
 */
export const textInputRoot = css({
  'alignItems': 'center',
  '&:not([hidden])': {
    display: 'flex',
  },
})

// `textInputBase` theme bridges
export const textInputFontFamilyVar = '--string-input-portable-text-input-font-family'
export const textInputFontWeightVar = '--string-input-portable-text-input-font-weight'
export const inputEnabledFgVar = '--string-input-portable-text-input-enabled-fg'
export const inputEnabledPlaceholderVar = '--string-input-portable-text-input-enabled-placeholder'
export const inputDisabledFgVar = '--string-input-portable-text-input-disabled-fg'
export const inputDisabledPlaceholderVar = '--string-input-portable-text-input-disabled-placeholder'
export const inputInvalidEnabledFgVar = '--string-input-portable-text-input-invalid-enabled-fg'
export const inputInvalidEnabledPlaceholderVar =
  '--string-input-portable-text-input-invalid-enabled-placeholder'
export const inputReadOnlyFgVar = '--string-input-portable-text-input-read-only-fg'
export const inputReadOnlyPlaceholderVar =
  '--string-input-portable-text-input-read-only-placeholder'

/**
 * Heavily based on the styling provided by Sanity UI.
 */
export const textInputBase = css({
  'appearance': 'none',
  'background': 'none',
  'border': 0,
  'borderRadius': 0,
  'outline': 'none',
  'width': '100%',
  'boxSizing': 'border-box',
  'fontFamily': `var(${textInputFontFamilyVar})`,
  'fontWeight': `var(${textInputFontWeightVar})`,
  'margin': 0,
  'position': 'relative',
  'zIndex': 1,
  'display': 'block',
  'color': 'var(--input-fg-color)',
  /* NOTE: This is a hack to disable Chrome’s autofill styles */
  '&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus, &:-webkit-autofill:active':
    {
      WebkitTextFillColor: 'var(--input-fg-color)',
      transition: 'background-color 5000s',
      transitionDelay: '86400s',
      /* 24h */
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
    '--input-fg-color': `var(${inputEnabledFgVar})`,
    '--input-placeholder-color': `var(${inputEnabledPlaceholderVar})`,
  },
  /* enabled */
  "&[data-scheme][data-tone]:not(:invalid):not(:disabled):not([data-read-only='true'])": {
    '--input-fg-color': `var(${inputEnabledFgVar})`,
    '--input-placeholder-color': `var(${inputEnabledPlaceholderVar})`,
  },
  /* disabled */
  '&[data-scheme][data-tone]:not(:invalid):disabled': {
    '--input-fg-color': `var(${inputDisabledFgVar})`,
    '--input-placeholder-color': `var(${inputDisabledPlaceholderVar})`,
  },
  /* invalid; read-only wins over it, as the rule below followed this one */
  "&[data-scheme][data-tone]:invalid:not([data-read-only='true'])": {
    '--input-fg-color': `var(${inputInvalidEnabledFgVar})`,
    '--input-placeholder-color': `var(${inputInvalidEnabledPlaceholderVar})`,
  },
  /* readOnly */
  "&[data-scheme][data-tone][data-read-only='true']": {
    '--input-fg-color': `var(${inputReadOnlyFgVar})`,
    '--input-placeholder-color': `var(${inputReadOnlyPlaceholderVar})`,
  },
})

// `textInputRepresentation` theme bridges
export const inputEnabledBgVar = '--string-input-portable-text-input-enabled-bg'
export const inputEnabledBorderShadowVar =
  '--string-input-portable-text-input-enabled-border-shadow'
export const inputInvalidEnabledBgVar = '--string-input-portable-text-input-invalid-enabled-bg'
export const inputInvalidEnabledBorderShadowVar =
  '--string-input-portable-text-input-invalid-enabled-border-shadow'
export const inputDisabledBgVar = '--string-input-portable-text-input-disabled-bg'
export const inputDisabledBorderShadowVar =
  '--string-input-portable-text-input-disabled-border-shadow'
export const inputInvalidDisabledBgVar = '--string-input-portable-text-input-invalid-disabled-bg'
export const inputInvalidDisabledFgVar = '--string-input-portable-text-input-invalid-disabled-fg'
export const inputInvalidDisabledBorderShadowVar =
  '--string-input-portable-text-input-invalid-disabled-border-shadow'
export const inputReadOnlyBgVar = '--string-input-portable-text-input-read-only-bg'
export const inputInvalidReadOnlyBgVar = '--string-input-portable-text-input-invalid-read-only-bg'
export const inputInvalidReadOnlyFgVar = '--string-input-portable-text-input-invalid-read-only-fg'
export const inputHoveredBgVar = '--string-input-portable-text-input-hovered-bg'
export const inputHoveredFgVar = '--string-input-portable-text-input-hovered-fg'
export const inputHoveredBorderShadowVar =
  '--string-input-portable-text-input-hovered-border-shadow'
export const inputInvalidHoveredBgVar = '--string-input-portable-text-input-invalid-hovered-bg'
export const inputInvalidHoveredFgVar = '--string-input-portable-text-input-invalid-hovered-fg'
export const inputInvalidHoveredBorderShadowVar =
  '--string-input-portable-text-input-invalid-hovered-border-shadow'

/**
 * Heavily based on the styling provided by Sanity UI.
 *
 * Applied to a `Card`; the `$hasPrefix`/`$hasSuffix`/`$unstableDisableFocusRing` branches live in
 * the classes below so that an omitted branch emits no declaration, like the original.
 */
export const textInputRepresentation = css({
  '--input-box-shadow': 'none',
  'position': 'absolute',
  'top': 0,
  'left': 0,
  'right': 0,
  'bottom': 0,
  'display': 'block',
  'pointerEvents': 'none',
  'zIndex': 0,
  // `&&`: Card sets `background-color` (muted) and `box-shadow` (shadow prop) itself
  '&&': {
    backgroundColor: 'var(--card-bg-color)',
    boxShadow: 'var(--input-box-shadow)',
  },
  '&[data-scheme][data-tone]': {
    '--card-bg-color': `var(${inputEnabledBgVar})`,
    '--card-fg-color': `var(${inputEnabledFgVar})`,
  },
  /* enabled */
  '*:not(:disabled) + &': {
    '&[data-scheme][data-tone][data-border]': {
      '--input-box-shadow': `var(${inputEnabledBorderShadowVar})`,
    },
  },
  /* invalid */
  '*:not(:disabled).invalid + &': {
    '&[data-scheme][data-tone]': {
      '--card-bg-color': `var(${inputInvalidEnabledBgVar})`,
      '--card-fg-color': `var(${inputInvalidEnabledFgVar})`,
    },
    '&[data-scheme][data-tone][data-border]': {
      '--input-box-shadow': `var(${inputInvalidEnabledBorderShadowVar})`,
    },
  },
  /* disabled */
  '*:not(.invalid):disabled + &': {
    '&[data-scheme][data-tone]': {
      '--card-bg-color': `var(${inputDisabledBgVar})`,
      '--card-fg-color': `var(${inputDisabledFgVar})`,
      '--card-icon-color': `var(${inputDisabledFgVar})`,
    },
    '&[data-scheme][data-tone][data-border]': {
      '--input-box-shadow': `var(${inputDisabledBorderShadowVar})`,
    },
  },
  '*.invalid:disabled + &': {
    '&[data-scheme][data-tone]': {
      '--card-bg-color': `var(${inputInvalidDisabledBgVar})`,
      '--card-fg-color': `var(${inputInvalidDisabledFgVar})`,
      '--card-icon-color': `var(${inputInvalidDisabledFgVar})`,
    },
    '&[data-scheme][data-tone][data-border]': {
      '--input-box-shadow': `var(${inputInvalidDisabledBorderShadowVar})`,
    },
  },
  /* readOnly */
  // `&&` (0,6,0) wins over the (0,5,0) invalid and disabled rules a read-only input also matches
  "*:not(.invalid)[data-read-only='true'] + &&": {
    '&[data-scheme][data-tone]': {
      '--card-bg-color': `var(${inputReadOnlyBgVar})`,
      '--card-fg-color': `var(${inputReadOnlyFgVar})`,
    },
  },
  "*.invalid[data-read-only='true'] + &&": {
    '&[data-scheme][data-tone]': {
      '--card-bg-color': `var(${inputInvalidReadOnlyBgVar})`,
      '--card-fg-color': `var(${inputInvalidReadOnlyFgVar})`,
    },
  },
  '@media (hover: hover)': {
    /* hovered */
    "*:not(:disabled):not([data-read-only='true']):not(.invalid):hover + &": {
      '&[data-scheme][data-tone]': {
        '--card-bg-color': `var(${inputHoveredBgVar})`,
        '--card-fg-color': `var(${inputHoveredFgVar})`,
      },
    },
    "*.invalid:not(:disabled):not([data-read-only='true']):hover + &": {
      '&[data-scheme][data-tone]': {
        '--card-bg-color': `var(${inputInvalidHoveredBgVar})`,
        '--card-fg-color': `var(${inputInvalidHoveredFgVar})`,
      },
    },
    "*:not(:disabled):not([data-read-only='true']):not(.invalid):not(:focus):hover + &": {
      '&[data-scheme][data-tone][data-border]': {
        '--input-box-shadow': `var(${inputHoveredBorderShadowVar})`,
      },
    },
    "*.invalid:not(:disabled):not([data-read-only='true']):not(:focus):hover + &": {
      '&[data-scheme][data-tone][data-border]': {
        '--input-box-shadow': `var(${inputInvalidHoveredBorderShadowVar})`,
      },
    },
  },
})

export const inputFocusBorderShadowVar = '--string-input-portable-text-input-focus-border-shadow'
export const inputFocusNoBorderShadowVar =
  '--string-input-portable-text-input-focus-no-border-shadow'

/**
 * The focused-state rules of `textInputRepresentation`, omitted when `$unstableDisableFocusRing`
 * is set. They followed `textInputRepresentation` so that, at equal specificity (0,6,0), the focus
 * shadow beat the invalid border shadow; `&&` raises them to (0,7,0) to keep it that way.
 */
export const textInputRepresentationFocusRing = css({
  '*:not(:disabled):focus + &&': {
    '&[data-scheme][data-tone][data-border]': {
      '--input-box-shadow': `var(${inputFocusBorderShadowVar})`,
    },
    '&[data-scheme][data-tone]:not([data-border])': {
      '--input-box-shadow': `var(${inputFocusNoBorderShadowVar})`,
    },
  },
})

/** `$hasPrefix`: `&&` because Card sets `border-radius` itself (radius prop) */
export const textInputRepresentationHasPrefix = css({
  '&&': {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
})

/** `$hasSuffix`: `&&` because Card sets `border-radius` itself (radius prop) */
export const textInputRepresentationHasSuffix = css({
  '&&': {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
})

// `responsiveInputPadding` theme bridges
export const inputPaddingTopVar = '--string-input-portable-text-input-padding-top'
export const inputPaddingRightVar = '--string-input-portable-text-input-padding-right'
export const inputPaddingBottomVar = '--string-input-portable-text-input-padding-bottom'
export const inputPaddingLeftVar = '--string-input-portable-text-input-padding-left'

/**
 * Heavily based on the styling provided by Sanity UI.
 */
export const responsiveInputPadding = css({
  paddingTop: `var(${inputPaddingTopVar})`,
  paddingRight: `var(${inputPaddingRightVar})`,
  paddingBottom: `var(${inputPaddingBottomVar})`,
  paddingLeft: `var(${inputPaddingLeftVar})`,
})

// `textInputFontSize` theme bridges
export const textInputFontSizeVar = '--string-input-portable-text-input-font-size'
export const textInputLineHeightVar = '--string-input-portable-text-input-line-height'

/**
 * Heavily based on the styling provided by Sanity UI.
 */
export const textInputFontSize = css({
  fontSize: `var(${textInputFontSizeVar})`,
  lineHeight: `var(${textInputLineHeightVar})`,
})

export const root = css({
  flex: 1,
  minWidth: 0,
  display: 'block',
  position: 'relative',
})
