import {type ReactNode} from 'react'

import {useProviderComponent} from './studio-components-hooks/useProviderComponent'

/**
 * The `studio.components.provider` chain. `StudioProvider` renders it around its children, so
 * plugin providers sit above `StudioLayout` and the Suspense boundary of its loading screen.
 *
 * @internal
 */
export function PluginProviders({children}: {children: ReactNode}) {
  const Provider = useProviderComponent()
  // oxlint-disable-next-line react/static-components -- this is intentional and how the middleware components has to work
  return <Provider>{children}</Provider>
}
