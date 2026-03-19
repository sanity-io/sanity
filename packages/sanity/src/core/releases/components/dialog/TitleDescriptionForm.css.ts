import {createVar, style} from '@vanilla-extract/css'

export const fontFamilyVar = createVar()
export const titleFontWeightVar = createVar()
export const titleFontSizeVar = createVar()
export const titleLineHeightVar = createVar()
export const titleMinHeightVar = createVar()
export const fgColorVar = createVar()
export const placeholderColorVar = createVar()
export const descFontWeightVar = createVar()
export const descFontSizeVar = createVar()
export const descLineHeightVar = createVar()

const baseTextArea = {
  resize: 'none' as const,
  overflow: 'hidden',
  appearance: 'none' as const,
  background: 'none',
  border: '0',
  padding: '0',
  borderRadius: '0',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box' as const,
  fontFamily: fontFamilyVar,
  margin: '0',
  position: 'relative' as const,
  zIndex: 1,
  display: 'block' as const,
  color: fgColorVar,
}

export const titleTextArea = style({
  ...baseTextArea,
  fontWeight: titleFontWeightVar,
  fontSize: titleFontSizeVar,
  lineHeight: titleLineHeightVar,
  minHeight: titleMinHeightVar,
  selectors: {
    '&::placeholder': {
      color: placeholderColorVar,
    },
    /* NOTE: This is a hack to disable Chrome's autofill styles */
    '&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus, &:-webkit-autofill:active': {
      WebkitTextFillColor: 'var(--input-fg-color) !important',
      transition: 'background-color 5000s',
      transitionDelay: '86400s' /* 24h */,
    },
  },
})

export const descriptionTextArea = style({
  ...baseTextArea,
  fontWeight: descFontWeightVar,
  fontSize: descFontSizeVar,
  height: 'auto',
  lineHeight: descLineHeightVar,
  maxWidth: '624px',
  selectors: {
    '&::placeholder': {
      color: placeholderColorVar,
    },
  },
})
