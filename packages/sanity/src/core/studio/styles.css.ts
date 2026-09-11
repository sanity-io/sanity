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

/** Targets `<html>`; `:where()` keeps this equal to the unscoped `html` original. */
const root = `html:where([${GLOBAL_STYLES_ATTRIBUTE}])`

/**
 * Scope for rules that did not select `<html>`. Wrapping the whole compound in `:where()` adds no
 * specificity at all, so each rule stays equal to its unscoped original — prefixing with `html`
 * outside `:where()` would add a type selector and let these win over rules that used to tie.
 */
const scope = `:where(html[${GLOBAL_STYLES_ATTRIBUTE}])`

/** The bare `::pseudo` selectors matched `<html>` too (the viewport scrollbar), so list it explicitly. */
const everyElement = (pseudo: string) => `${scope}${pseudo}, ${scope} *${pseudo}`

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

globalStyle(`${scope} body`, {
  scrollbarGutter: 'stable',
})

globalStyle(`${scope} #sanity`, {
  fontFamily: textFontFamilyVar,
})

globalStyle(`${scope} b, ${scope} strong`, {
  fontWeight: textMediumWeightVar,
})
