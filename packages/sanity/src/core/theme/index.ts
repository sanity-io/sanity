import {buildTheme, type RootTheme} from '@sanity/ui/theme'

export {buildLegacyTheme} from './_legacy/theme'
export {type LegacyThemeProps, type LegacyThemeTints} from './_legacy/types'
export {type StudioTheme, type StudioThemeColorSchemeKey} from './types'

let _defaultTheme: RootTheme | undefined

/**
 * @internal
 * @deprecated Will be removed in upcoming major version
 * */
export function getDefaultTheme(): RootTheme {
  if (!_defaultTheme) {
    _defaultTheme = buildTheme()
  }
  return _defaultTheme
}

/**
 * The default theme. This is a proxy to the default theme, in order to lazily initialize it
 * on use and not pay the cost of building the theme on module load.
 *
 * @internal
 * @deprecated Will be removed in upcoming major version.
 * */
export const defaultTheme: RootTheme = /* @__PURE__ */ new Proxy({} as RootTheme, {
  get(_target, prop, receiver) {
    return Reflect.get(getDefaultTheme(), prop, receiver)
  },
  ownKeys() {
    return Reflect.ownKeys(getDefaultTheme())
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Object.getOwnPropertyDescriptor(getDefaultTheme(), prop)
  },
  has(_target, prop) {
    return prop in getDefaultTheme()
  },
})
