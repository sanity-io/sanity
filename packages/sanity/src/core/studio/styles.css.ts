import {createGlobalVar, createVar, fallbackVar, globalStyle} from '@vanilla-extract/css'

import {GLOBAL_STYLES_ATTRIBUTE} from './globalStyleConstants'

const SCROLLBAR_SIZE = 12 // px
const SCROLLBAR_BORDER_SIZE = 4 // px
const globalStylesRoot = `:where(html[${GLOBAL_STYLES_ATTRIBUTE}])`

export const selectionBackgroundColor = createVar()
export const uiColorBg = createVar()
export const uiColorBorder = createVar()
export const uiColorMutedFg = createVar()
export const uiFontTextFamily = createVar()
export const uiFontTextWeightMedium = createVar()
export const webkitResizerBackgroundImage = createVar()

const uiCardBorderColor = createGlobalVar('card-border-color')
const uiCardMutedFgColor = createGlobalVar('card-muted-fg-color')

function globalElementStyle(selector: string, rule: Parameters<typeof globalStyle>[1]) {
  globalStyle(`${globalStylesRoot}${selector}, ${globalStylesRoot} ${selector}`, rule)
}

globalElementStyle('::-webkit-resizer', {
  backgroundImage: webkitResizerBackgroundImage,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'bottom right',
})

globalElementStyle('::-webkit-scrollbar', {
  width: SCROLLBAR_SIZE,
  height: SCROLLBAR_SIZE,
})

globalElementStyle('::-webkit-scrollbar-corner', {
  backgroundColor: 'transparent',
})

globalElementStyle('::-webkit-scrollbar-thumb', {
  backgroundClip: 'content-box',
  backgroundColor: fallbackVar(uiCardBorderColor, uiColorBorder),
  borderWidth: SCROLLBAR_BORDER_SIZE,
  borderStyle: 'solid',
  borderColor: 'transparent',
})

globalElementStyle('::-webkit-scrollbar-thumb:hover', {
  backgroundColor: fallbackVar(uiCardMutedFgColor, uiColorMutedFg),
})

globalElementStyle('::-webkit-scrollbar-track', {
  background: 'transparent',
})

globalStyle(`${globalStylesRoot} *::selection`, {
  backgroundColor: selectionBackgroundColor,
})

globalStyle(globalStylesRoot, {
  backgroundColor: uiColorBg,
})

globalStyle(`${globalStylesRoot} body`, {
  scrollbarGutter: 'stable',
})

globalStyle('#sanity', {
  vars: {
    '--static-css-file-loaded-studio': 'true',
  },
})

globalStyle(`${globalStylesRoot} #sanity`, {
  fontFamily: uiFontTextFamily,
})

globalStyle(`${globalStylesRoot} b`, {
  fontWeight: uiFontTextWeightMedium,
})

globalStyle(`${globalStylesRoot} strong`, {
  fontWeight: uiFontTextWeightMedium,
})
