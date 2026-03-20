 
import {globalStyle,createVar} from '@vanilla-extract/css'

// CSS variables for dynamic theme values
export const resizerBgImageVar = createVar()
export const scrollbarBorderColorVar = createVar()
export const scrollbarMutedFgVar = createVar()
export const selectionBgVar = createVar()
export const formGutterSizeVar = createVar()
export const formGutterGapVar = createVar()
export const htmlBgVar = createVar()
export const fontFamilyVar = createVar()
export const fontWeightMediumVar = createVar()

globalStyle('::-webkit-resizer', {
  backgroundImage: resizerBgImageVar,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'bottom right',
})

globalStyle('::-webkit-scrollbar', {
  width: '12px',
  height: '12px',
})

globalStyle('::-webkit-scrollbar-corner', {
  backgroundColor: 'transparent',
})

globalStyle('::-webkit-scrollbar-thumb', {
  backgroundClip: 'content-box',
  backgroundColor: scrollbarBorderColorVar,
  border: '4px solid transparent',
})

globalStyle('::-webkit-scrollbar-thumb:hover', {
  backgroundColor: scrollbarMutedFgVar,
})

globalStyle('::-webkit-scrollbar-track', {
  background: 'transparent',
})

globalStyle('*::selection', {
  backgroundColor: selectionBgVar,
})

globalStyle(':root', {
  vars: {
    '--formGutterSize': formGutterSizeVar,
    '--formGutterGap': formGutterGapVar,
  },
})

globalStyle('html', {
  backgroundColor: htmlBgVar,
})

globalStyle('body', {
  scrollbarGutter: 'stable',
})

globalStyle('#sanity', {
  fontFamily: fontFamilyVar,
})

globalStyle('b', {
  fontWeight: fontWeightMediumVar,
})

globalStyle('strong', {
  fontWeight: fontWeightMediumVar,
})
