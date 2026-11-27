import {DesktopIcon} from '@sanity/icons/Desktop'
import {MoonIcon} from '@sanity/icons/Moon'
import {SunIcon} from '@sanity/icons/Sun'
import {type MessageBusConnection} from '@sanity/sdk/dashboard'
import {studioTheme, type ThemeColorSchemeKey, ThemeProvider} from '@sanity/ui'
import {
  type ComponentType,
  type ReactNode,
  use,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react'
import {browser} from 'react-dom'
import {
  ColorSchemeSetValueContext,
  ColorSchemeSystemValueContext,
  ColorSchemeValueContext,
} from 'sanity/_singletons'

import {type TFunction} from '../i18n/types'
import {getMessageBusConnection} from '../store/messageBus/getMessageBusConnection'
import {type StudioThemeColorSchemeKey} from '../theme/types'
import {ColorSchemeTransitionMarker, startColorSchemeTransition} from './colorSchemeTransition'
import {setDocumentColorScheme} from './documentColorScheme'

const LOCAL_STORAGE_KEY = 'sanityStudio:ui:colorScheme'
const PREFERS_DARK = '(prefers-color-scheme: dark)'

// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
function toScheme(value: unknown): StudioThemeColorSchemeKey {
  return value === 'dark' || value === 'light' ? value : 'system'
}

function getSystemScheme(): 'light' | 'dark' {
  return window.matchMedia(PREFERS_DARK).matches ? 'dark' : 'light'
}

function resolveScheme(
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  scheme: StudioThemeColorSchemeKey,
  systemScheme: 'light' | 'dark',
): 'light' | 'dark' {
  return scheme === 'system' ? systemScheme : scheme
}

interface ColorSchemeState {
  /** The scheme picked in Studio or published by the host. The `scheme` prop overrides it. */
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  scheme: StudioThemeColorSchemeKey
  systemScheme: 'light' | 'dark'
  /** Whether a change of the resolved scheme is committing, which renders the transition marker */
  transitioning: boolean
}

type ColorSchemeAction =
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  | {type: 'scheme'; scheme: StudioThemeColorSchemeKey}
  | {type: 'systemScheme'; systemScheme: 'light' | 'dark'; transition: boolean}
  | {type: 'transition'}
  | {type: 'settle'}

function colorSchemeReducer(state: ColorSchemeState, action: ColorSchemeAction): ColorSchemeState {
  switch (action.type) {
    case 'scheme':
      if (action.scheme === state.scheme) return state
      return {
        ...state,
        scheme: action.scheme,
        transitioning:
          state.transitioning ||
          resolveScheme(action.scheme, state.systemScheme) !==
            resolveScheme(state.scheme, state.systemScheme),
      }
    case 'systemScheme':
      if (action.systemScheme === state.systemScheme) return state
      return {
        ...state,
        systemScheme: action.systemScheme,
        transitioning: state.transitioning || action.transition,
      }
    case 'transition':
      return state.transitioning ? state : {...state, transitioning: true}
    case 'settle':
      return state.transitioning ? {...state, transitioning: false} : state
    default: {
      const unknownAction: never = action
      throw new Error(`Unknown color scheme action: ${JSON.stringify(unknownAction)}`)
    }
  }
}

/** @internal */
export interface ColorSchemeProviderProps {
  children: ReactNode
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  onSchemeChange?: (nextScheme: StudioThemeColorSchemeKey) => void
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  scheme?: StudioThemeColorSchemeKey
}

/**
 * Takes the scheme from the `scheme` prop, the message bus host or localStorage, in that order.
 * Reads localStorage and the OS scheme as it renders, so it suspends on the server.
 *
 * @internal
 */
export function ColorSchemeProvider(props: ColorSchemeProviderProps) {
  return (
    <ColorSchemeStateProvider
      {...props}
      connection={props.scheme ? undefined : getMessageBusConnection()}
    />
  )
}

/** @internal */
export function ColorSchemeLocalStorageProvider({
  children,
  onSchemeChange,
}: Pick<ColorSchemeProviderProps, 'children' | 'onSchemeChange'>) {
  return (
    <ColorSchemeStateProvider connection={undefined} onSchemeChange={onSchemeChange}>
      {children}
    </ColorSchemeStateProvider>
  )
}

/** @internal */
export function ColorSchemeCustomProvider({
  children,
  onSchemeChange,
  scheme,
}: Pick<ColorSchemeProviderProps, 'children' | 'onSchemeChange'> & {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  scheme: StudioThemeColorSchemeKey
}): React.JSX.Element {
  return (
    <ColorSchemeStateProvider
      connection={undefined}
      onSchemeChange={onSchemeChange}
      scheme={scheme}
    >
      {children}
    </ColorSchemeStateProvider>
  )
}

function ColorSchemeStateProvider({
  children,
  connection,
  onSchemeChange,
  scheme: schemeProp,
}: ColorSchemeProviderProps & {connection: MessageBusConnection | undefined}) {
  use(browser())
  const isControlled = Boolean(schemeProp)
  // The message bus host owns the appearance, so Studio offers no way to change it.
  const hostScheme = useMemo(() => connection?.subscribe('preferences.color-scheme'), [connection])
  const [state, dispatch] = useReducer(colorSchemeReducer, undefined, () => ({
    scheme: hostScheme
      ? (hostScheme.getCurrent() ?? 'system')
      : toScheme(localStorage.getItem(LOCAL_STORAGE_KEY)),
    systemScheme: getSystemScheme(),
    transitioning: false,
  }))
  const scheme = schemeProp || state.scheme
  const pinsColorScheme = !hostScheme

  useEffect(() => {
    if (!hostScheme) return undefined
    const subscription = hostScheme.subscribe(() => {
      const nextScheme = hostScheme.getCurrent() ?? 'system'
      startColorSchemeTransition(() => dispatch({type: 'scheme', scheme: nextScheme}))
    })
    return () => subscription.unsubscribe()
  }, [hostScheme])

  // In system mode the browser applies an OS appearance change to `light-dark()` right away, while
  // the theme only takes it when the transition commits. Until then the document keeps showing the
  // scheme it had, so the crossfade starts from one picture.
  const systemSchemeHold = useRef<{nextScheme: 'light' | 'dark'; release: () => void} | null>(null)
  const handleSystemSchemeChange = useEffectEvent((nextScheme: 'light' | 'dark') => {
    if (systemSchemeHold.current) {
      systemSchemeHold.current.nextScheme = nextScheme
    } else if (pinsColorScheme && scheme === 'system') {
      systemSchemeHold.current = {
        nextScheme,
        release: setDocumentColorScheme(nextScheme === 'dark' ? 'light' : 'dark'),
      }
    }
    startColorSchemeTransition(() =>
      dispatch({type: 'systemScheme', systemScheme: nextScheme, transition: scheme === 'system'}),
    )
  })
  useEffect(() => {
    const query = window.matchMedia(PREFERS_DARK)
    const handleChange = () => handleSystemSchemeChange(query.matches ? 'dark' : 'light')
    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])
  useLayoutEffect(() => {
    if (systemSchemeHold.current?.nextScheme !== state.systemScheme) return
    systemSchemeHold.current.release()
    systemSchemeHold.current = null
  }, [state.systemScheme])
  useLayoutEffect(() => {
    const hold = systemSchemeHold
    return () => hold.current?.release()
  }, [])

  useEffect(() => {
    if (state.transitioning) dispatch({type: 'settle'})
  }, [state.transitioning])

  useLayoutEffect(() => {
    // Act only on an explicitly pinned scheme. In system mode the browser's own
    // `prefers-color-scheme` resolution is already correct for both native and down-leveled
    // `light-dark()`, and a host page's `color-scheme` stays as it set it.
    if (pinsColorScheme && (scheme === 'light' || scheme === 'dark')) {
      return setDocumentColorScheme(scheme)
    }
    return undefined
    // systemScheme is deliberate: the helper's mismatch check reads matchMedia, so an OS flip
    // while the appearance is pinned must re-run the write
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- see above
  }, [scheme, pinsColorScheme, state.systemScheme])

  useEffect(() => {
    if (isControlled) return
    if (typeof onSchemeChange === 'function') {
      onSchemeChange(scheme)
    }
    if (!hostScheme) {
      localStorage.setItem(LOCAL_STORAGE_KEY, scheme)
    }
  }, [hostScheme, isControlled, onSchemeChange, scheme])

  const setScheme = useMemo(() => {
    if (isControlled) {
      return typeof onSchemeChange === 'function'
        ? // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
          (nextScheme: StudioThemeColorSchemeKey) =>
            startColorSchemeTransition(() => {
              dispatch({type: 'transition'})
              onSchemeChange(nextScheme)
            })
        : false
    }
    if (hostScheme) return false
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    return (nextScheme: StudioThemeColorSchemeKey) =>
      startColorSchemeTransition(() => dispatch({type: 'scheme', scheme: toScheme(nextScheme)}))
  }, [hostScheme, isControlled, onSchemeChange])

  return (
    <ColorSchemeSetValueContext.Provider value={setScheme}>
      <ColorSchemeValueContext.Provider value={scheme}>
        <ColorSchemeSystemValueContext.Provider value={state.systemScheme}>
          {/* oxlint-disable-next-line no-deprecated -- will fix in follow up PR */}
          <ThemeProvider scheme={resolveScheme(scheme, state.systemScheme)} theme={studioTheme}>
            {/* Note: this is a fallback ThemeProvider that is for any components */}
            {/* that may render before the StudioThemeProvider renders. this is */}
            {/* required because the StudioThemeProvider has a dependence on the */}
            {/* active workspace provided via the ActiveWorkspaceMatcher */}
            {children}
            {state.transitioning && <ColorSchemeTransitionMarker />}
          </ThemeProvider>
        </ColorSchemeSystemValueContext.Provider>
      </ColorSchemeValueContext.Provider>
    </ColorSchemeSetValueContext.Provider>
  )
}

/** @internal */
export function useColorSchemeSetValue():
  | false
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  | ((nextScheme: StudioThemeColorSchemeKey) => void) {
  const setValue = use(ColorSchemeSetValueContext)
  if (setValue === null) throw new Error('Could not find `ColorSchemeSetValueContext` context')
  return setValue
}

/** @internal */
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export function useColorSchemeInternalValue(): StudioThemeColorSchemeKey {
  const value = use(ColorSchemeValueContext)
  if (value === null) throw new Error('Could not find `ColorSchemeValueContext` context')
  return value
}

/** @internal */
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export function useColorSchemeValue(): ThemeColorSchemeKey {
  const scheme = useColorSchemeInternalValue()
  if (scheme !== 'system') return scheme
  const systemScheme = use(ColorSchemeSystemValueContext)
  if (systemScheme === null)
    throw new Error('Could not find `ColorSchemeSystemValueContext` context')
  return systemScheme
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
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  name: StudioThemeColorSchemeKey
  onSelect: () => void
  selected: boolean
  title: string
}
/**
 * @internal
 */
export function useColorSchemeOptions(
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  setScheme: (nextScheme: StudioThemeColorSchemeKey) => void,
  t: TFunction<'studio'>,
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
