import {studioTheme} from '@sanity/ui'
import {StudioTheme} from './types'

export * from './_legacy'
export * from './types'

/** @internal */
export const defaultTheme: StudioTheme = {
  ...studioTheme,
  focusRing: {offset: -1, width: 2},
}
