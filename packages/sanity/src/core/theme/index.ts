import {buildTheme, type RootTheme} from '@sanity/ui/theme'

import {applyUi5SelectedColors} from './ui5SelectedColors'

// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export {type StudioTheme, type StudioThemeColorSchemeKey} from './types'

let _defaultTheme: RootTheme | undefined

/**
 * The theme a workspace gets when its config sets none: `@sanity/ui`'s studio theme, with the
 * UI 5 selected colours (see `applyUi5SelectedColors`). Built once, on first use.
 *
 * @internal
 */
export function getStudioDefaultTheme(): RootTheme {
  if (!_defaultTheme) {
    _defaultTheme = applyUi5SelectedColors(buildTheme())
  }
  return _defaultTheme
}

/**
 * @internal
 * @deprecated Will be removed in upcoming major version
 * */
export function getDefaultTheme(): RootTheme {
  return getStudioDefaultTheme()
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
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    return Reflect.get(getDefaultTheme(), prop, receiver)
  },
  ownKeys() {
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    return Reflect.ownKeys(getDefaultTheme())
  },
  getOwnPropertyDescriptor(_target, prop) {
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    return Object.getOwnPropertyDescriptor(getDefaultTheme(), prop)
  },
  has(_target, prop) {
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    return prop in getDefaultTheme()
  },
})
