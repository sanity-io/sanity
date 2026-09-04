import {createVar, globalStyle} from '@vanilla-extract/css'

globalStyle('#sanity', {
  vars: {
    '--static-css-file-loaded-studio': 'true',
  },
})

/**
 * Attribute `GlobalStyle` sets on `<html>` while mounted. The rules below only apply under it so
 * that loading `sanity/bundle.css` alone (embedded studios, `unstable_globalStyles` off) leaves the
 * host document untouched, like the runtime-injected stylesheet it replaces.
 */
export const GLOBAL_STYLES_ATTRIBUTE = 'data-sanity-global-styles'

export const resizerImageVar = createVar()
export const borderColorVar = createVar()
export const mutedFgColorVar = createVar()
export const selectionColorVar = createVar()
export const bgColorVar = createVar()
export const textFontFamilyVar = createVar()
export const textMediumWeightVar = createVar()

/** `:where()` keeps the specificity of every rule equal to its unscoped original. */
const root = `html:where([${GLOBAL_STYLES_ATTRIBUTE}])`

/** The bare `::pseudo` selectors matched `<html>` too (the viewport scrollbar), so list it explicitly. */
const everyElement = (pseudo: string) => `${root}${pseudo}, ${root} *${pseudo}`

const SCROLLBAR_SIZE = 12 // px
const SCROLLBAR_BORDER_SIZE = 4 // px

globalStyle(everyElement('::-webkit-resizer'), {
  backgroundImage: resizerImageVar,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'bottom right',
})

globalStyle(everyElement('::-webkit-scrollbar'), {
  width: SCROLLBAR_SIZE,
  height: SCROLLBAR_SIZE,
})

globalStyle(everyElement('::-webkit-scrollbar-corner'), {
  backgroundColor: 'transparent',
})

globalStyle(everyElement('::-webkit-scrollbar-thumb'), {
  backgroundClip: 'content-box',
  backgroundColor: `var(--card-border-color, ${borderColorVar})`,
  border: `${SCROLLBAR_BORDER_SIZE}px solid transparent`,
})

globalStyle(everyElement('::-webkit-scrollbar-thumb:hover'), {
  backgroundColor: `var(--card-muted-fg-color, ${mutedFgColorVar})`,
})

globalStyle(everyElement('::-webkit-scrollbar-track'), {
  background: 'transparent',
})

globalStyle(everyElement('::selection'), {
  backgroundColor: selectionColorVar,
})

globalStyle(root, {
  backgroundColor: bgColorVar,
})

globalStyle(`${root} body`, {
  scrollbarGutter: 'stable',
})

globalStyle(`${root} #sanity`, {
  fontFamily: textFontFamilyVar,
})

globalStyle(`${root} b, ${root} strong`, {
  fontWeight: textMediumWeightVar,
})
