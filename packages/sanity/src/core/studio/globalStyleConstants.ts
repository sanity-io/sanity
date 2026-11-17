import {version as packageVersion} from '../../../package.json'

declare const __PKG_VERSION__: string | undefined

export const GLOBAL_STYLES_ATTRIBUTE = 'data-sanity-global-styles'

function getGlobalStylesBuildId() {
  if (typeof __PKG_VERSION__ === 'string') return __PKG_VERSION__

  try {
    if (process.env.PKG_VERSION) return process.env.PKG_VERSION
  } catch {
    // `process` is not available when the Studio runs from source in a browser.
  }

  return packageVersion
}

export const GLOBAL_STYLES_BUILD_ID = getGlobalStylesBuildId()

export const GLOBAL_STYLE_VARIABLES = {
  selectionBackgroundColor: '--sanity-global-style-selection-background-color',
  uiColorBg: '--sanity-global-style-ui-color-bg',
  uiColorBorder: '--sanity-global-style-ui-color-border',
  uiColorMutedFg: '--sanity-global-style-ui-color-muted-fg',
  uiFontTextFamily: '--sanity-global-style-ui-font-text-family',
  uiFontTextWeightMedium: '--sanity-global-style-ui-font-text-weight-medium',
  webkitResizerBackgroundImage: '--sanity-global-style-webkit-resizer-background-image',
} as const

export const GLOBAL_STYLE_VARIABLE_NAMES = Object.values(GLOBAL_STYLE_VARIABLES)

export type GlobalStyleVariableName =
  (typeof GLOBAL_STYLE_VARIABLES)[keyof typeof GLOBAL_STYLE_VARIABLES]
