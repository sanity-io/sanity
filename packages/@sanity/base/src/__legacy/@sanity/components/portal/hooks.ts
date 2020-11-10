import {useContext} from 'react'
import {PortalContext} from './context'

export function usePortal() {
  const portal = useContext(PortalContext)

  if (!portal) {
    throw new Error('missing portal in context')
  }

  return portal
}
