import {type ComponentType, type PropsWithChildren} from 'react'
import {useObservable} from 'react-rx'

import {useRenderingContextStore} from '../store/_legacy/datastores'
import {type Capability} from '../store/renderingContext/types'

type Props = PropsWithChildren<{
  capability: Capability
}>

/**
 * `CapabilityGate` only renders its children if the current Studio rendering context does not
 * provide the specified capability.
 *
 * This allows consumers of the component to conveniently mark a portion of the React tree as
 * providing a capability that may be overriden by the Studio rendering context. If the rendering
 * context provides this capability, the local implementation will not be rendered.
 */
export const CapabilityGate: ComponentType<Props> = ({children, capability}) => {
  const renderingContextStore = useRenderingContextStore()
  const renderingContextCapabilities = useObservable(renderingContextStore.capabilities, {})
  const renderingContextHasCapability = renderingContextCapabilities[capability] === true

  if (renderingContextHasCapability) {
    return null
  }

  return children
}
