import {buildTheme} from '@sanity/ui/theme'
import {StudioTheme} from './types'

export * from './_legacy'
export * from './types'

/** @internal */
export const defaultTheme: StudioTheme = buildTheme({
  container: [320, 640, 960, 1280, 1600, 1920],
})
