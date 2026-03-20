import {createGlobalVar, createVar, fallbackVar, globalStyle} from '@vanilla-extract/css'

const SCROLLBAR_SIZE = 12 // px
const SCROLLBAR_BORDER_SIZE = 4 // px

// Used in FormContainer and FormRow, should be rewritten to regular `createVar` later instead of `createVar` later instead of `createGlobalVar`
export const formGutterSize = createGlobalVar('formGutterSize', {
  syntax: '<length>',
  inherits: true,
  initialValue: '0px',
})
export const formGutterGap = createGlobalVar('formGutterGap', {
  syntax: '<length>',
  inherits: true,
  initialValue: '0px',
})
export const selectionBackgroundColor = createVar()

// equivalent to font.text.family in Sanity UI theme context
export const uiFontTextFamily = createVar()
// equivalent to font.text.weights.medium in Sanity UI theme constants
export const uiFontTextWeightsMedium = createVar()
// equivalent to color.bg in Sanity UI theme constants
export const uiColoBg = createVar()
// equivalent to color.border in Sanity UI theme constants
export const uiColorBorder = createVar()
// equivalent to color.muted.fg in Sanity UI theme constants
export const uiColorMutedFg = createVar()

// An svg data uri built client side, unfortunately
export const webkitResizerSvg = createVar()

const uiCardBorderColorVar = createGlobalVar('card-border-color')
const uiCardMutedFgColorVar = createGlobalVar('card-muted-fg-color')

globalStyle('::-webkit-resizer', {
  backgroundImage: webkitResizerSvg,
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
  backgroundColor: fallbackVar(uiCardBorderColorVar, uiColorBorder),
  borderWidth: SCROLLBAR_BORDER_SIZE,
  borderStyle: 'solid',
  borderColor: 'transparent',
})
globalStyle('::-webkit-scrollbar-thumb:hover', {
  backgroundColor: fallbackVar(uiCardMutedFgColorVar, uiColorMutedFg),
})
globalStyle('::-webkit-scrollbar-track', {
  background: 'transparent',
})

globalStyle('*::selection', {
  backgroundColor: selectionBackgroundColor,
})

globalStyle('html', {
  backgroundColor: uiColoBg,
})

globalStyle('body', {
  scrollbarGutter: 'stable',
})

globalStyle('#sanity', {
  fontFamily: uiFontTextFamily,
})

globalStyle('b', {
  fontWeight: uiFontTextWeightsMedium,
})
globalStyle('strong', {
  fontWeight: uiFontTextWeightsMedium,
})
