import {DesktopIcon, MoonIcon, SunIcon} from '@sanity/icons'
import {studioTheme, type ThemeColorSchemeKey, ThemeProvider, usePrefersDark} from '@sanity/ui'
import {
  type ComponentType,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from 'react'
import {ColorSchemeSetValueContext, ColorSchemeValueContext} from 'sanity/_singletons'

import {type TFunction} from '../i18n'
import {type StudioThemeColorSchemeKey} from '../theme/types'
import {getSnapshot, setSnapshot, subscribe} from './colorSchemeStore'

/** @internal */
function useSystemScheme(): ThemeColorSchemeKey {
  const prefersDark = usePrefersDark()
  return prefersDark ? 'dark' : 'light'
}

function ColorThemeProvider({
  children,
  scheme: _scheme,
}: {
  children: ReactNode
  scheme: StudioThemeColorSchemeKey
}) {
  const systemScheme = useSystemScheme()
  const scheme = _scheme === 'system' ? systemScheme : _scheme

  return (
    <ThemeProvider scheme={scheme} theme={studioTheme}>
      {/* Note: this is a fallback ThemeProvider that is for any components */}
      {/* that may render before the StudioThemeProvider renders. this is */}
      {/* required because the StudioThemeProvider has a dependence on the */}
      {/* active workspace provided via the ActiveWorkspaceMatcher */}
      {children}
    </ThemeProvider>
  )
}

const LOCAL_STORAGE_KEY = 'sanityStudio:ui:colorScheme'

/** @internal */
export interface ColorSchemeProviderProps {
  children: ReactNode
  onSchemeChange?: (nextScheme: StudioThemeColorSchemeKey) => void
  scheme?: StudioThemeColorSchemeKey
}

/** @internal */
export function ColorSchemeProvider({
  children,
  onSchemeChange,
  scheme: schemeProp,
}: ColorSchemeProviderProps) {
  if (schemeProp) {
    return (
      <ColorSchemeCustomProvider scheme={schemeProp} onSchemeChange={onSchemeChange}>
        {children}
      </ColorSchemeCustomProvider>
    )
  }

  return (
    <ColorSchemeLocalStorageProvider onSchemeChange={onSchemeChange}>
      {children}
    </ColorSchemeLocalStorageProvider>
  )
}

/**
 * Uses useSyncExternalStore to ensure that localStorage is accessed in a SSR hydration compatible way
 * @internal
 */
export function ColorSchemeLocalStorageProvider({
  children,
  onSchemeChange,
}: Pick<ColorSchemeProviderProps, 'children' | 'onSchemeChange'>) {
  const scheme = useSyncExternalStore<StudioThemeColorSchemeKey>(
    subscribe,
    getSnapshot,
    // Only called during server-side rendering, and hydration if using hydrateRoot
    // https://beta.reactjs.org/apis/react/useSyncExternalStore#adding-support-for-server-rendering
    () => 'system',
  )

  useEffect(() => {
    if (typeof onSchemeChange === 'function') {
      onSchemeChange(scheme)
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, scheme)
  }, [onSchemeChange, scheme])

  return (
    <ColorSchemeSetValueContext.Provider value={setSnapshot}>
      <ColorSchemeValueContext.Provider value={scheme}>
        <ColorThemeProvider scheme={scheme}>{children}</ColorThemeProvider>
      </ColorSchemeValueContext.Provider>
    </ColorSchemeSetValueContext.Provider>
  )
}

/**
 * If the `scheme` prop is provided we don't need to setup any logic to handle localStorage
 * @internal
 */
export function ColorSchemeCustomProvider({
  children,
  onSchemeChange,
  scheme,
}: Pick<ColorSchemeProviderProps, 'children' | 'onSchemeChange'> & {
  scheme: StudioThemeColorSchemeKey
}): React.JSX.Element {
  return (
    <ColorSchemeSetValueContext.Provider
      value={typeof onSchemeChange === 'function' ? onSchemeChange : false}
    >
      <ColorSchemeValueContext.Provider value={scheme}>
        <ColorThemeProvider scheme={scheme}>{children}</ColorThemeProvider>
      </ColorSchemeValueContext.Provider>
    </ColorSchemeSetValueContext.Provider>
  )
}

/** @alpha */
export function useColorSchemeSetValue():
  | false
  | ((nextScheme: StudioThemeColorSchemeKey) => void) {
  const setValue = useContext(ColorSchemeSetValueContext)
  if (setValue === null) throw new Error('Could not find `ColorSchemeSetValueContext` context')
  return setValue
}

/** @internal */
export function useColorSchemeInternalValue(): StudioThemeColorSchemeKey {
  const value = useContext(ColorSchemeValueContext)
  if (value === null) throw new Error('Could not find `ColorSchemeValueContext` context')
  return value
}

/** @alpha */
export function useColorSchemeValue(): ThemeColorSchemeKey {
  const scheme = useColorSchemeInternalValue()
  const systemScheme = useSystemScheme()
  return scheme === 'system' ? systemScheme : scheme
}

/**
 * @deprecated Use `useColorSchemeValue` or `useColorSchemeSetValue` instead
 * @internal
 */
export function useColorScheme() {
  useEffect(() => {
    console.warn(
      'useColorScheme() is deprecated, use useColorSchemeValue() or useColorSchemeSetValue() instead',
    )
  }, [])

  const scheme = useColorSchemeValue()
  const setScheme = useColorSchemeSetValue()
  return useMemo(() => ({scheme, setScheme}), [scheme, setScheme])
}

interface ColorSchemeOption {
  icon: ComponentType
  label: string
  name: StudioThemeColorSchemeKey
  onSelect: () => void
  selected: boolean
  title: string
}
/**
 * @internal
 */
export function useColorSchemeOptions(
  setScheme: (nextScheme: StudioThemeColorSchemeKey) => void,
  t: TFunction<'studio', undefined>,
) {
  const scheme = useColorSchemeInternalValue()

  return useMemo<ColorSchemeOption[]>(() => {
    return [
      {
        title: t('user-menu.color-scheme.system-title'),
        name: 'system',
        label: t('user-menu.color-scheme.system-description'),
        selected: scheme === 'system',
        onSelect: () => setScheme('system'),
        icon: DesktopIcon,
      },
      {
        title: t('user-menu.color-scheme.dark-title'),
        name: 'dark',
        label: t('user-menu.color-scheme.dark-description'),
        selected: scheme === 'dark',
        onSelect: () => setScheme('dark'),
        icon: MoonIcon,
      },
      {
        title: t('user-menu.color-scheme.light-title'),
        name: 'light',
        label: t('user-menu.color-scheme.light-description'),
        selected: scheme === 'light',
        onSelect: () => setScheme('light'),
        icon: SunIcon,
      },
    ]
  }, [scheme, setScheme, t])
}
