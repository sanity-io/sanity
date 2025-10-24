import {buildTheme, type RootTheme} from '@sanity/ui/theme'

export {buildLegacyTheme} from './_legacy/theme'
export {type LegacyThemeProps, type LegacyThemeTints} from './_legacy/types'
export {type StudioTheme, type StudioThemeColorSchemeKey} from './types'

/**
 * @internal
 * @deprecated Will be removed in upcoming major version
 * */
export const defaultTheme: RootTheme = buildTheme()
