import {type ComponentType, type ReactNode} from 'react'

import {useMiddlewareComponents} from '../../config/components/useMiddlewareComponents'
import {pickProviderComponent} from './picks'

/** The props the resolved `studio.components.provider` chain is rendered with */
export interface ProviderChainProps {
  children: ReactNode
}

/** The innermost layer of the chain: every plugin's providers have wrapped `children` by now */
function PassthroughProvider({children}: ProviderChainProps) {
  return children
}

/**
 * The `studio.components.provider` middleware chain. `StudioLayout` renders it around the
 * Suspense boundary of the studio's loading screen, so what a plugin provides here is available
 * to its `layout`, `navbar` and tools, and a promise it starts here can be `use()`d below without
 * a boundary of its own.
 *
 * @internal
 */
export function useProviderComponent(): ComponentType<ProviderChainProps> {
  return useMiddlewareComponents({
    defaultComponent: PassthroughProvider,
    pick: pickProviderComponent,
  })
}
