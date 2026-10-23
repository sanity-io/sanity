import {css} from '#styled-system/css'

/** `${space[3]}px` */
export const space3Var = '--title-field-space-3'
/** `font.text.family` */
export const fontTextFamilyVar = '--title-field-font-text-family'
/** `font.text.weights.semibold` */
export const fontTextWeightSemiboldVar = '--title-field-font-text-weight-semibold'
/** `${font.text.sizes[3].fontSize}px` */
export const fontTextSize3FontSizeVar = '--title-field-font-text-size-3-font-size'
/** `${font.text.sizes[3].lineHeight}px` */
export const fontTextSize3LineHeightVar = '--title-field-font-text-size-3-line-height'
/** `color.input.default.enabled.fg` */
export const inputFgColorVar = '--title-field-input-fg-color'
/** `color.input.default.enabled.placeholder` */
export const inputPlaceholderColorVar = '--title-field-input-placeholder-color'

export const root = css({
  display: 'grid',
  gridTemplateColumns: '1fr',
  paddingTop: `var(${space3Var})`,
})

export const titleInput = css({
  'resize': 'none',
  'overflow': 'hidden',
  'appearance': 'none',
  'background': 'none',
  'border': 0,
  'padding': 0,
  'borderRadius': 0,
  'outline': 'none',
  'width': '100%',
  'boxSizing': 'border-box',
  'fontFamily': `var(${fontTextFamilyVar})`,
  'fontWeight': `var(${fontTextWeightSemiboldVar})`,
  'fontSize': `var(${fontTextSize3FontSizeVar})`,
  'lineHeight': `var(${fontTextSize3LineHeightVar})`,
  'margin': 0,
  'position': 'relative',
  'zIndex': 1,
  'display': 'block',
  'transition': 'height 500ms',
  'color': `var(${inputFgColorVar})`,
  /* NOTE: This is a hack to disable Chrome’s autofill styles */
  '&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus, &:-webkit-autofill:active':
    {
      WebkitTextFillColor: `var(${inputFgColorVar})`,
      transition: 'background-color 5000s',
      transitionDelay: '86400s',
      /* 24h */
    },
  '&::placeholder': {
    color: `var(${inputPlaceholderColorVar})`,
  },
})
