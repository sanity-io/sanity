import React, {createContext, useContext, useEffect, useMemo, useSyncExternalStore} from 'react'
import {studioTheme, ThemeColorSchemeKey, ThemeProvider, usePrefersDark} from '@sanity/ui'
import {DesktopIcon, MoonIcon, SunIcon} from '@sanity/icons'
import type {StudioThemeColorSchemeKey} from '../theme/types'

/**
 * Used to keep track of the internal value, which can be "system" in addition to "light" and "dark"
 * @internal
 */
export const ColorSchemeValueContext = createContext<StudioThemeColorSchemeKey | null>(null)

/**
 * The setter for ColorSchemeValueContext, in a separate context to avoid unnecessary re-renders
 * If set to false then the UI should adjust to reflect that the Studio can't change the color scheme
 * @internal
 */
export const ColorSchemeSetValueContext = createContext<
  ((nextScheme: StudioThemeColorSchemeKey) => void) | false | null
>(null)

/** @internal */
function useSystemScheme(): ThemeColorSchemeKey {
  const prefersDark = usePrefersDark()
  return prefersDark ? 'dark' : 'light'
}

function ColorThemeProvider({
  children,
  scheme: _scheme,
}: {
  children: React.ReactNode
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
  children: React.ReactNode
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
  const store = useMemo(() => {
    let snapshot: StudioThemeColorSchemeKey
    const subscribers = new Set<() => void>()

    return {
      subscribe: (onStoreChange: () => void) => {
        if (!snapshot) {
          snapshot = getScheme(localStorage.getItem(LOCAL_STORAGE_KEY)) || 'system'
        }
        subscribers.add(onStoreChange)
        return () => {
          subscribers.delete(onStoreChange)
        }
      },
      getSnapshot: () => snapshot,
      setSnapshot: (nextScheme: StudioThemeColorSchemeKey) => {
        snapshot = getScheme(nextScheme)
        for (const subscription of subscribers) {
          subscription()
        }
      },
      // Only called during server-side rendering, and hydration if using hydrateRoot
      // https://beta.reactjs.org/apis/react/useSyncExternalStore#adding-support-for-server-rendering
      getServerSnapshot: () => 'system',
    }
  }, [])
  const scheme = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot)

  useEffect(() => {
    if (typeof onSchemeChange === 'function') {
      onSchemeChange(scheme)
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, scheme)
  }, [onSchemeChange, scheme])

  return (
    <ColorSchemeSetValueContext.Provider value={store.setSnapshot}>
      <ColorSchemeValueContext.Provider value={scheme}>
        <ColorThemeProvider scheme={scheme}>{children}</ColorThemeProvider>
      </ColorSchemeValueContext.Provider>
    </ColorSchemeSetValueContext.Provider>
  )
}

function getScheme(scheme: unknown): StudioThemeColorSchemeKey {
  switch (scheme) {
    case 'dark':
    case 'light':
      return scheme
    default:
      return 'system'
  }
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
}) {
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
export function useColorSchemeSetValue() {
  const setValue = useContext(ColorSchemeSetValueContext)
  if (setValue === null) throw new Error('Could not find `ColorSchemeSetValueContext` context')
  return setValue
}

/** @internal */
export function _useColorSchemeInternalValue(): StudioThemeColorSchemeKey {
  const value = useContext(ColorSchemeValueContext)
  if (value === null) throw new Error('Could not find `ColorSchemeValueContext` context')
  return value
}

/** @alpha */
export function useColorSchemeValue(): ThemeColorSchemeKey {
  const scheme = _useColorSchemeInternalValue()
  const systemScheme = useSystemScheme()
  return scheme === 'system' ? systemScheme : scheme
}

/**
 * @deprecated Use `useColorSchemeValue` or `useColorSchemeSetValue` instead
 * @internal
 */
export function useColorScheme() {
  const scheme = useColorSchemeValue()
  const setScheme = useColorSchemeSetValue()
  return useMemo(() => ({scheme, setScheme}), [scheme, setScheme])
}

interface ColorSchemeOption {
  icon: React.ComponentType
  label: string
  name: StudioThemeColorSchemeKey
  onSelect: () => void
  selected: boolean
  title: string
}
/**
 * @internal
 */
export function useColorSchemeOptions(setScheme: (nextScheme: StudioThemeColorSchemeKey) => void) {
  const scheme = _useColorSchemeInternalValue()

  return useMemo(() => {
    return [
      {
        title: 'System',
        name: 'system',
        label: 'Use system appearance',
        selected: scheme === 'system',
        onSelect: () => setScheme('system'),
        icon: DesktopIcon,
      },
      {
        title: 'Dark',
        name: 'dark',
        label: 'Use dark appearance',
        selected: scheme === 'dark',
        onSelect: () => setScheme('dark'),
        icon: MoonIcon,
      },
      {
        title: 'Light',
        name: 'light',
        label: 'Use light appearance',
        selected: scheme === 'light',
        onSelect: () => setScheme('light'),
        icon: SunIcon,
      },
    ] satisfies ColorSchemeOption[]
  }, [scheme, setScheme])
}
