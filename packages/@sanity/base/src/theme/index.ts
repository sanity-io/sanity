import {studioTheme} from '@sanity/ui'
import {SanityTheme} from './types'

export * from './types'

export const defaultTheme: SanityTheme = {
  ...studioTheme,
  focusRing: {offset: -1, width: 2},
}
