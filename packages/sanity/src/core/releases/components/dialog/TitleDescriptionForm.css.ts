import {createVar, style} from '@vanilla-extract/css'

// Theme bridge (`font.text.*` and `color.input.default.enabled.*` are not published as `--card-*`
// variables). The title and description assign different weights/sizes to the same variables.
export const fontTextFamilyVar = createVar()
export const fontTextWeightVar = createVar()
export const fontTextSizeVar = createVar()
export const fontTextLineHeightVar = createVar()
export const inputFgColorVar = createVar()
export const inputPlaceholderColorVar = createVar()

const textArea = style({
  resize: 'none',
  overflow: 'hidden',
  appearance: 'none',
  background: 'none',
  border: 0,
  padding: 0,
  borderRadius: 0,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: fontTextFamilyVar,
  fontWeight: fontTextWeightVar,
  fontSize: fontTextSizeVar,
  lineHeight: fontTextLineHeightVar,
  margin: 0,
  position: 'relative',
  zIndex: 1,
  display: 'block',
  color: inputFgColorVar,
  selectors: {
    '&::placeholder': {
      color: inputPlaceholderColorVar,
    },
  },
})

export const titleTextArea = style([
  textArea,
  {
    minHeight: fontTextLineHeightVar,
    selectors: {
      /* NOTE: This is a hack to disable Chrome's autofill styles */
      '&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus, &:-webkit-autofill:active':
        {
          WebkitTextFillColor: 'var(--input-fg-color) !important',
          transition: 'background-color 5000s',
          transitionDelay: '86400s' /* 24h */,
        },
    },
  },
])

export const descriptionTextArea = style([
  textArea,
  {
    height: 'auto',
    maxWidth: '624px',
  },
])
