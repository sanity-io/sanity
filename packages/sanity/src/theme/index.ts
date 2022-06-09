import {studioTheme} from '@sanity/ui'
import {StudioTheme} from './types'

export * from './types'

export const defaultTheme: StudioTheme = {
  ...studioTheme,
  focusRing: {offset: -1, width: 2},
}
