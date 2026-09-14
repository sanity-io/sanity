import {createVar, style} from '@vanilla-extract/css'

/** `${space[3]}px` */
export const space3Var = createVar()
/** `font.text.family` */
export const fontTextFamilyVar = createVar()
/** `font.text.weights.semibold` */
export const fontTextWeightSemiboldVar = createVar()
/** `${font.text.sizes[3].fontSize}px` */
export const fontTextSize3FontSizeVar = createVar()
/** `${font.text.sizes[3].lineHeight}px` */
export const fontTextSize3LineHeightVar = createVar()
/** `color.input.default.enabled.fg` */
export const inputFgColorVar = createVar()
/** `color.input.default.enabled.placeholder` */
export const inputPlaceholderColorVar = createVar()

export const root = style({
  display: 'grid',
  gridTemplateColumns: '1fr',
  paddingTop: space3Var,
})

export const titleInput = style({
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
  'fontFamily': fontTextFamilyVar,
  'fontWeight': fontTextWeightSemiboldVar,
  'fontSize': fontTextSize3FontSizeVar,
  'lineHeight': fontTextSize3LineHeightVar,
  'margin': 0,
  'position': 'relative',
  'zIndex': 1,
  'display': 'block',
  'transition': 'height 500ms',
  'color': inputFgColorVar,
  'selectors': {
    /* NOTE: This is a hack to disable Chrome’s autofill styles */
    '&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus, &:-webkit-autofill:active':
      {
        // `!important` carried over from the original rule
        WebkitTextFillColor: 'var(--input-fg-color) !important',
        transition: 'background-color 5000s',
        transitionDelay: '86400s' /* 24h */,
      },
  },
  '::placeholder': {
    color: inputPlaceholderColorVar,
  },
})
