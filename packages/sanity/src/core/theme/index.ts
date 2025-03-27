import {buildTheme, type RootTheme} from '@sanity/ui/theme'

export * from './_legacy'
export * from './types'

let c: RootTheme

/** @internal */
export const defaultTheme = (): RootTheme => {
  if (!c) {
    c = buildTheme()
  }
  return c
}
