import {type ComponentType, type ReactNode} from 'react'

import {useMiddlewareComponents} from '../../config/components/useMiddlewareComponents'
import {pickProviderComponent} from './picks'

/** The props the resolved `studio.components.provider` chain is rendered with */
export interface ProviderChainProps {
  children: ReactNode
}

function PassthroughProvider({children}: ProviderChainProps) {
  return children
}

/**
 * The `studio.components.provider` middleware chain, rendered by `PluginProviders` inside
 * `StudioProvider`.
 *
 * @internal
 */
export function useProviderComponent(): ComponentType<ProviderChainProps> {
  return useMiddlewareComponents({
    defaultComponent: PassthroughProvider,
    pick: pickProviderComponent,
  })
}
