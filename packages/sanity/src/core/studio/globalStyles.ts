/**
 * Attribute `GlobalStyle` sets on `<html>` while mounted. The rules below only apply under it so
 * that loading `sanity/bundle.css` alone (embedded studios, `unstable_globalStyles` off) leaves the
 * host document untouched, like the runtime-injected stylesheet it replaces.
 */
export const GLOBAL_STYLES_ATTRIBUTE = 'data-sanity-global-styles'

/** Theme values `GlobalStyle` sets on `<html>` for the rules below */
export const resizerImageVar = '--studio-resizer-image'
export const borderColorVar = '--studio-border-color'
export const mutedFgColorVar = '--studio-muted-fg-color'
export const selectionColorVar = '--studio-selection-color'
export const bgColorVar = '--studio-bg-color'
export const textFontFamilyVar = '--studio-text-font-family'
export const textMediumWeightVar = '--studio-text-medium-weight'

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

/**
 * The studio's document-level styles. They have no element of their own to hang a class off, so
 * `packages/sanity/panda.config.ts` adds them to Panda's `globalCss`, which ships them in
 * `sanity/bundle.css` like the component styles.
 */
export const studioGlobalCss = {
  [everyElement('::-webkit-resizer')]: {
    backgroundImage: `var(${resizerImageVar})`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'bottom right',
  },
  [everyElement('::-webkit-scrollbar')]: {
    width: `${SCROLLBAR_SIZE}px`,
    height: `${SCROLLBAR_SIZE}px`,
  },
  [everyElement('::-webkit-scrollbar-corner')]: {
    backgroundColor: 'transparent',
  },
  [everyElement('::-webkit-scrollbar-thumb')]: {
    backgroundClip: 'content-box',
    backgroundColor: `var(--card-border-color, var(${borderColorVar}))`,
    border: `${SCROLLBAR_BORDER_SIZE}px solid transparent`,
  },
  [everyElement('::-webkit-scrollbar-thumb:hover')]: {
    backgroundColor: `var(--card-muted-fg-color, var(${mutedFgColorVar}))`,
  },
  [everyElement('::-webkit-scrollbar-track')]: {
    background: 'transparent',
  },
  [everyElement('::selection')]: {
    backgroundColor: `var(${selectionColorVar})`,
  },
  [root]: {
    backgroundColor: `var(${bgColorVar})`,
  },
  [`${scope} body`]: {
    scrollbarGutter: 'stable',
  },
  [`${scope} #sanity`]: {
    fontFamily: `var(${textFontFamilyVar})`,
  },
  [`${scope} b, ${scope} strong`]: {
    fontWeight: `var(${textMediumWeightVar})`,
  },
}
