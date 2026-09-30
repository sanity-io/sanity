import {type ComponentType, type ReactNode} from 'react'

import {useMiddlewareComponents} from '../../config/components/useMiddlewareComponents'
import {pickProvidersComponent} from './picks'

/** The props the resolved `studio.components.providers` chain is rendered with */
export interface StudioProvidersProps {
  children: ReactNode
}

/** The innermost layer of the chain: every plugin's providers have wrapped `children` by now */
function StudioProviders({children}: StudioProvidersProps) {
  return children
}

/**
 * The `studio.components.providers` middleware chain. `StudioLayout` renders it around the
 * Suspense boundary of the studio's loading screen, so what a plugin provides here is available
 * to its `layout`, `navbar` and tools, and a promise it starts here can be `use()`d below without
 * a boundary of its own.
 *
 * @internal
 */
export function useProvidersComponent(): ComponentType<StudioProvidersProps> {
  return useMiddlewareComponents({
    defaultComponent: StudioProviders,
    pick: pickProvidersComponent,
  })
}
