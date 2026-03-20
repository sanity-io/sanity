import {createVar, style} from '@vanilla-extract/css'

export const paddingTopVar = createVar()

export const root = style({
  display: 'grid',
  gridTemplateColumns: '1fr',
  paddingTop: paddingTopVar,
})

export const fontFamilyVar = createVar()
export const fontWeightVar = createVar()
export const fontSizeVar = createVar()
export const lineHeightVar = createVar()
export const fgColorVar = createVar()
export const placeholderColorVar = createVar()

export const titleInput = style({
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
  fontFamily: fontFamilyVar,
  fontWeight: fontWeightVar,
  fontSize: fontSizeVar,
  lineHeight: lineHeightVar,
  margin: 0,
  position: 'relative',
  zIndex: 1,
  display: 'block',
  transition: 'height 500ms',
  color: fgColorVar,
  selectors: {
    /* NOTE: This is a hack to disable Chrome's autofill styles */
    '&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus, &:-webkit-autofill:active': {
      WebkitTextFillColor: 'var(--input-fg-color) !important',
      transition: 'background-color 5000s',
      transitionDelay: '86400s' /* 24h */,
    },
    '&::placeholder': {
      color: placeholderColorVar,
    },
  },
})
