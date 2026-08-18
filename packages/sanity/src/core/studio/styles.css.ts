import {createGlobalVar, createVar, fallbackVar, globalStyle} from '@vanilla-extract/css'

const SCROLLBAR_SIZE = 12 // px
const SCROLLBAR_BORDER_SIZE = 4 // px

export const selectionBackgroundColor = createVar()
export const uiColorBg = createVar()
export const uiColorBorder = createVar()
export const uiColorMutedFg = createVar()
export const uiFontTextFamily = createVar()
export const uiFontTextWeightMedium = createVar()
export const webkitResizerBackgroundImage = createVar()

const uiCardBorderColor = createGlobalVar('card-border-color')
const uiCardMutedFgColor = createGlobalVar('card-muted-fg-color')

globalStyle('::-webkit-resizer', {
  backgroundImage: webkitResizerBackgroundImage,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'bottom right',
})
globalStyle('::-webkit-scrollbar', {
  width: SCROLLBAR_SIZE,
  height: SCROLLBAR_SIZE,
})
globalStyle('::-webkit-scrollbar-corner', {
  backgroundColor: 'transparent',
})
globalStyle('::-webkit-scrollbar-thumb', {
  backgroundClip: 'content-box',
  backgroundColor: fallbackVar(uiCardBorderColor, uiColorBorder),
  borderWidth: SCROLLBAR_BORDER_SIZE,
  borderStyle: 'solid',
  borderColor: 'transparent',
})
globalStyle('::-webkit-scrollbar-thumb:hover', {
  backgroundColor: fallbackVar(uiCardMutedFgColor, uiColorMutedFg),
})
globalStyle('::-webkit-scrollbar-track', {
  background: 'transparent',
})

globalStyle('*::selection', {
  backgroundColor: selectionBackgroundColor,
})

globalStyle('html', {
  backgroundColor: uiColorBg,
})

globalStyle('body', {
  scrollbarGutter: 'stable',
})

globalStyle('#sanity', {
  fontFamily: uiFontTextFamily,
  vars: {
    '--static-css-file-loaded-studio': 'true',
  },
})

globalStyle('b', {
  fontWeight: uiFontTextWeightMedium,
})

globalStyle('strong', {
  fontWeight: uiFontTextWeightMedium,
})
