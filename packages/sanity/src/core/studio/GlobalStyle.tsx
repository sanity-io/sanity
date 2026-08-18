import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {rgba} from '@sanity/ui/theme'
import {setElementVars} from '@vanilla-extract/dynamic'
import {useInsertionEffect} from 'react'

import {
  uiColorMutedFg,
  selectionBackgroundColor,
  uiColorBg,
  uiColorBorder,
  uiFontTextFamily,
  uiFontTextWeightMedium,
  webkitResizerBackgroundImage,
} from './styles.css'

// Construct a resize handle icon as a data URI, to be displayed in browsers that support the `::-webkit-resizer` selector.
function buildResizeHandleDataUri(hexColor: string) {
  const encodedStrokeColor = encodeURIComponent(hexColor)
  const encodedSvg = `%3Csvg width='9' height='9' viewBox='0 0 9 9' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 8L8 1' stroke='${encodedStrokeColor}' stroke-linecap='round'/%3E%3Cpath d='M5 8L8 5' stroke='${encodedStrokeColor}' stroke-linecap='round'/%3E%3C/svg%3E%0A`
  return `url("data:image/svg+xml,${encodedSvg}")`
}

export function GlobalStyle(): null {
  const {color, font} = useThemeV2()
  const webkitResizerBackgroundImageValue = buildResizeHandleDataUri(color.icon)
  const selectionBackgroundColorValue = rgba(color.focusRing, 0.3)

  useInsertionEffect(() => {
    setElementVars(document.documentElement, {
      [selectionBackgroundColor]: selectionBackgroundColorValue,
      [uiColorBg]: color.bg,
      [uiColorBorder]: color.border,
      [uiColorMutedFg]: color.muted.fg,
      [uiFontTextFamily]: font.text.family,
      [uiFontTextWeightMedium]: font.text.weights.medium.toString(),
      [webkitResizerBackgroundImage]: webkitResizerBackgroundImageValue,
    })

    return () => {
      setElementVars(document.documentElement, {
        [selectionBackgroundColor]: null,
        [uiColorBg]: null,
        [uiColorBorder]: null,
        [uiColorMutedFg]: null,
        [uiFontTextFamily]: null,
        [uiFontTextWeightMedium]: null,
        [webkitResizerBackgroundImage]: null,
      })
    }
  }, [
    color.bg,
    color.border,
    color.muted.fg,
    font.text.family,
    font.text.weights.medium,
    selectionBackgroundColorValue,
    webkitResizerBackgroundImageValue,
  ])

  return null
}
