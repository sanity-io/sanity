import {createGlobalVar, createVar, fallbackVar, globalStyle, style} from '@vanilla-extract/css'

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

/**
 * Added to `<html>` by `GlobalStyle`. This stylesheet is always loaded, so the rules below are
 * scoped to it in order to stay opt-in through the `unstable_globalStyles` prop on `Studio`.
 */
export const globalStylesRoot = style({})

// Scrollbars and selections have to be styled on `<html>` itself as well as everything inside it.
function scoped(selector: string) {
  return `${globalStylesRoot}${selector}, ${globalStylesRoot} ${selector}`
}

globalStyle(scoped('::-webkit-resizer'), {
  backgroundImage: webkitResizerBackgroundImage,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'bottom right',
})
globalStyle(scoped('::-webkit-scrollbar'), {
  width: SCROLLBAR_SIZE,
  height: SCROLLBAR_SIZE,
})
globalStyle(scoped('::-webkit-scrollbar-corner'), {
  backgroundColor: 'transparent',
})
globalStyle(scoped('::-webkit-scrollbar-thumb'), {
  backgroundClip: 'content-box',
  backgroundColor: fallbackVar(uiCardBorderColor, uiColorBorder),
  borderWidth: SCROLLBAR_BORDER_SIZE,
  borderStyle: 'solid',
  borderColor: 'transparent',
})
globalStyle(scoped('::-webkit-scrollbar-thumb:hover'), {
  backgroundColor: fallbackVar(uiCardMutedFgColor, uiColorMutedFg),
})
globalStyle(scoped('::-webkit-scrollbar-track'), {
  background: 'transparent',
})

globalStyle(scoped('::selection'), {
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
