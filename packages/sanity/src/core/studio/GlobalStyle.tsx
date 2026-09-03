import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {rgba} from '@sanity/ui/theme'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {useInsertionEffect} from 'react'

import {
  bgColorVar,
  borderColorVar,
  GLOBAL_STYLES_ATTRIBUTE,
  mutedFgColorVar,
  resizerImageVar,
  selectionColorVar,
  textFontFamilyVar,
  textMediumWeightVar,
} from './styles.css'

// Construct a resize handle icon as a data URI, to be displayed in browsers that support the `::-webkit-resizer` selector.
function buildResizeHandleDataUri(hexColor: string) {
  const encodedStrokeColor = encodeURIComponent(hexColor)
  const encodedSvg = `%3Csvg width='9' height='9' viewBox='0 0 9 9' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 8L8 1' stroke='${encodedStrokeColor}' stroke-linecap='round'/%3E%3Cpath d='M5 8L8 5' stroke='${encodedStrokeColor}' stroke-linecap='round'/%3E%3C/svg%3E%0A`
  return `url("data:image/svg+xml,${encodedSvg}")`
}

// Several studios on one page share the document root; the attribute stays while any is mounted.
let mountedCount = 0

function markDocument(html: HTMLElement): () => void {
  mountedCount += 1
  html.setAttribute(GLOBAL_STYLES_ATTRIBUTE, '')
  return () => {
    mountedCount -= 1
    if (mountedCount === 0) html.removeAttribute(GLOBAL_STYLES_ATTRIBUTE)
  }
}

/**
 * Applies the studio's document-level styles (`styles.css.ts`) by marking `<html>` and feeding
 * it the theme values those rules read through CSS variables.
 */
export function GlobalStyle(): null {
  const {color, font} = useThemeV2()
  const iconColor = color.icon
  const borderColor = color.border
  const mutedFgColor = color.muted.fg
  const focusRingColor = color.focusRing
  const bgColor = color.bg
  const fontFamily = font.text.family
  const mediumWeight = font.text.weights.medium

  useInsertionEffect(() => markDocument(document.documentElement), [])

  useInsertionEffect(() => {
    const html = document.documentElement
    const vars = assignInlineVars({
      [resizerImageVar]: buildResizeHandleDataUri(iconColor),
      [borderColorVar]: borderColor,
      [mutedFgColorVar]: mutedFgColor,
      [selectionColorVar]: rgba(focusRingColor, 0.3),
      [bgColorVar]: bgColor,
      [textFontFamilyVar]: fontFamily,
      [textMediumWeightVar]: String(mediumWeight),
    })
    for (const [name, value] of Object.entries(vars)) html.style.setProperty(name, value)
    return () => {
      for (const name of Object.keys(vars)) html.style.removeProperty(name)
    }
  }, [iconColor, borderColor, mutedFgColor, focusRingColor, bgColor, fontFamily, mediumWeight])

  return null
}
