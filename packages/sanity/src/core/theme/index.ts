import {buildTheme, type RootTheme} from '@sanity/ui/theme'

export * from './_legacy'
export * from './types'

/** @internal */
export const defaultTheme: RootTheme = buildTheme()
