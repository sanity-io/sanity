import {buildTheme, type RootTheme} from '@sanity/ui-v2/theme'

export * from './_legacy'
export * from './types'

/** @internal */
export const defaultTheme: RootTheme = buildTheme()
