import React, {ReactElement} from 'react'
import {Config} from '../config'
import type {StudioThemeColorSchemeKey} from '../theme/types'
import {GlobalStyle} from './GlobalStyle'
import {RouterHistory} from './router'
import {StudioProvider} from './StudioProvider'
import {StudioLayout} from './StudioLayout'

/**
 * @hidden
 * @beta */
export interface StudioProps {
  config: Config
  basePath?: string
  /**
   * Useful for scenarios where the Studio is embedded in another app,
   * and the surrounding app also implements light and dark color schemes.
   *
   * The callback is fired whenever the user selects a new color scheme in the "Appearance" menu in the top-right dropdown.
   * It also fires on first render with its initial value if you don't provide a `scheme` prop.
   *
   * If the user selects "System" in the "Appearance" menu, the callback will be fired with `"system"` as the scheme.
   * To resolve `"system"` to the same color scheme as the Studio use the `usePrefersDark` hook from `@sanity/ui`:
   *
   * ```tsx
   * import {usePrefersDark} from '@sanity/ui'
   * import {Studio} from 'sanity'
   *
   * export default function StudioPage() {
   *   const prefersDark = usePrefersDark()
   *   const [_scheme, setScheme] = useState('system')
   *   const prefersScheme = prefersDark ? 'dark' : 'light'
   *   const scheme = _scheme === 'system' ? prefersScheme : _scheme
   *
   *   return (
   *     <AppLayout scheme={scheme}>
   *       <Studio config={config} onSchemeChange={setScheme} />
   *     </AppLayout>
   *   )
   * }
   * ```
   *
   *
   * @hidden
   * @beta
   */
  onSchemeChange?: (nextScheme: StudioThemeColorSchemeKey) => void
  /**
   * By default the Studio handles the color scheme itself, but you can provide a color scheme to use.
   * If you only define `scheme` then the top-right "Appearance" dropdown menu will be hidden,
   * and the Studio will stay in sync with the `scheme` prop.
   *
   * You may setup two-way sync and re-enable the "Appearance" dropdown menu by also providing an `onSchemeChange` callback:
   * ```tsx
   * import {Studio} from 'sanity'
   * import {useSession} from 'your-app'
   *
   * export default function StudioPage() {
   *   const session = useSession()
   *   // Overrides the default scheme to be what's in the app user session
   *   const [_scheme, setScheme] = useState(session.scheme)
   *   const scheme = _scheme === 'system' ? session.scheme : _scheme
   *
   *   return (
   *     <AppLayout scheme={scheme}>
   *       <Studio config={config} scheme={scheme} onSchemeChange={setScheme} />
   *     </AppLayout>
   *   )
   * }
   * ```
   *
   *
   * @hidden
   * @beta
   */
  scheme?: StudioThemeColorSchemeKey
  /**
   * @hidden
   * @beta */
  unstable_history?: RouterHistory
  /**
   * @hidden
   * @beta */
  unstable_globalStyles?: boolean
  /**
   * @hidden
   * @beta */
  unstable_noAuthBoundary?: boolean
}

/**
 * @hidden
 * @beta */
export function Studio(props: StudioProps): ReactElement {
  const {
    basePath,
    config,
    onSchemeChange,
    scheme,
    unstable_globalStyles: globalStyles,
    unstable_history,
    unstable_noAuthBoundary,
  } = props

  return (
    <StudioProvider
      basePath={basePath}
      config={config}
      onSchemeChange={onSchemeChange}
      scheme={scheme}
      unstable_history={unstable_history}
      unstable_noAuthBoundary={unstable_noAuthBoundary}
    >
      {globalStyles && <GlobalStyle />}
      <StudioLayout />
    </StudioProvider>
  )
}
