import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {rgba} from '@sanity/ui/theme'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {useInsertionEffect, useState} from 'react'

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

type Vars = Record<string, string>

const VAR_NAMES = Object.keys(
  assignInlineVars({
    [resizerImageVar]: '',
    [borderColorVar]: '',
    [mutedFgColorVar]: '',
    [selectionColorVar]: '',
    [bgColorVar]: '',
    [textFontFamilyVar]: '',
    [textMediumWeightVar]: '',
  }),
)

/**
 * Studios mounted in the same document share `<html>`. The most recently mounted instance's
 * values win, like the last injected global stylesheet did, a theme change keeps an instance's
 * position, and unmounting one instance hands the root back to the remaining ones instead of
 * stripping their values. `Map` preserves insertion order on `set` for an existing key.
 */
const instances = new Map<symbol, Vars>()

function applyLatest(html: HTMLElement) {
  let latest: Vars | undefined
  for (const vars of instances.values()) latest = vars
  if (latest) {
    html.setAttribute(GLOBAL_STYLES_ATTRIBUTE, '')
    for (const [name, value] of Object.entries(latest)) html.style.setProperty(name, value)
    return
  }
  html.removeAttribute(GLOBAL_STYLES_ATTRIBUTE)
  for (const name of VAR_NAMES) html.style.removeProperty(name)
}

function mountInstance(html: HTMLElement, id: symbol): () => void {
  instances.set(id, {})
  return () => {
    instances.delete(id)
    applyLatest(html)
  }
}

function updateInstance(html: HTMLElement, id: symbol, vars: Vars) {
  if (!instances.has(id)) return
  instances.set(id, vars)
  applyLatest(html)
}

/**
 * Applies the studio's document-level styles (`styles.css.ts`) by marking `<html>` and feeding
 * it the theme values those rules read through CSS variables.
 */
export function GlobalStyle(): null {
  const [id] = useState(() => Symbol('GlobalStyle'))
  const {color, font} = useThemeV2()
  const iconColor = color.icon
  const borderColor = color.border
  const mutedFgColor = color.muted.fg
  const focusRingColor = color.focusRing
  const bgColor = color.bg
  const fontFamily = font.text.family
  const mediumWeight = font.text.weights.medium

  useInsertionEffect(() => mountInstance(document.documentElement, id), [id])

  useInsertionEffect(() => {
    updateInstance(
      document.documentElement,
      id,
      assignInlineVars({
        [resizerImageVar]: buildResizeHandleDataUri(iconColor),
        [borderColorVar]: borderColor,
        [mutedFgColorVar]: mutedFgColor,
        [selectionColorVar]: rgba(focusRingColor, 0.3),
        [bgColorVar]: bgColor,
        [textFontFamilyVar]: fontFamily,
        [textMediumWeightVar]: String(mediumWeight),
      }),
    )
  }, [id, iconColor, borderColor, mutedFgColor, focusRingColor, bgColor, fontFamily, mediumWeight])

  return null
}
