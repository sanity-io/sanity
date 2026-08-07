import {type ComponentType, type PropsWithChildren} from 'react'
import {useSyncObservable} from 'react-rx'

import {useRenderingContextStore} from '../store/datastores'
import {type Capability} from '../store/renderingContext/types'

type Props = PropsWithChildren<{
  capability: Capability
  condition?: 'available' | 'unavailable'
}>

/**
 * `CapabilityGate` only renders its children if the current Studio rendering context does not
 * provide the specified capability.
 *
 * This allows consumers of the component to conveniently mark a portion of the React tree as
 * providing a capability that may be overriden by the Studio rendering context. If the rendering
 * context provides this capability, the local implementation will not be rendered.
 *
 * @internal
 */
export const CapabilityGate: ComponentType<Props> = ({
  children,
  capability,
  condition = 'unavailable',
}) => {
  const renderingContextStore = useRenderingContextStore()
  // Kept synchronous: capabilities emit once at boot, so deferring only
  // delays the gate flipping without any render-load benefit.
  const renderingContextCapabilities = useSyncObservable(renderingContextStore.capabilities, {})
  const renderingContextHasCapability = renderingContextCapabilities[capability] === true

  if (condition === 'available' && !renderingContextHasCapability) {
    return null
  }

  if (condition === 'unavailable' && renderingContextHasCapability) {
    return null
  }

  return children
}
