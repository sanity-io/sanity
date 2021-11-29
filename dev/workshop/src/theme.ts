// import {theme} from '@sanity/base'
import type {RootTheme} from '@sanity/ui'
import {studioTheme as defaults} from '@sanity/ui'

// @todo: use the same theme object as the Studio
export const theme: RootTheme = {
  ...defaults,
  focusRing: {
    offset: -1,
    width: 2,
  },
}
