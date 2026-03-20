 

import {assignInlineVars} from '@vanilla-extract/dynamic'
import {rgba} from '@sanity/ui/theme'
import {type ComponentType} from 'react'
import {useTheme_v2 as useThemeV2} from '@sanity/ui'

import {useWorkspace} from './workspace'
import {
  resizerBgImageVar,
  scrollbarBorderColorVar,
  scrollbarMutedFgVar,
  selectionBgVar,
  formGutterSizeVar,
  formGutterGapVar,
  htmlBgVar,
  fontFamilyVar,
  fontWeightMediumVar,
} from './GlobalStyle.css'

// Construct a resize handle icon as a data URI, to be displayed in browsers that support the `::-webkit-resizer` selector.
function buildResizeHandleDataUri(hexColor: string) {
  const encodedStrokeColor = encodeURIComponent(hexColor)
  const encodedSvg = `%3Csvg width='9' height='9' viewBox='0 0 9 9' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 8L8 1' stroke='${encodedStrokeColor}' stroke-linecap='round'/%3E%3Cpath d='M5 8L8 5' stroke='${encodedStrokeColor}' stroke-linecap='round'/%3E%3C/svg%3E%0A`
  return `url("data:image/svg+xml,${encodedSvg}")`
}

export const GlobalStyle: ComponentType = () => {
  const {
    advancedVersionControl: {enabled: advancedVersionControlEnabled},
  } = useWorkspace()

  const {color, font, space} = useThemeV2()

  return (
    <div
      style={assignInlineVars({
        [resizerBgImageVar]: buildResizeHandleDataUri(color.icon),
        [scrollbarBorderColorVar]: `var(--card-border-color, ${color.border})`,
        [scrollbarMutedFgVar]: `var(--card-muted-fg-color, ${color.muted.fg})`,
        [selectionBgVar]: rgba(color.focusRing, 0.3),
        [formGutterSizeVar]: `${advancedVersionControlEnabled ? space[4] : 0}px`,
        [formGutterGapVar]: `${advancedVersionControlEnabled ? space[3] : 0}px`,
        [htmlBgVar]: color.bg,
        [fontFamilyVar]: font.text.family,
        [fontWeightMediumVar]: `${font.text.weights.medium}`,
      })}
    />
  )
}
