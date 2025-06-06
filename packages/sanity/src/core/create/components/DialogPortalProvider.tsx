import {PortalProvider, usePortal} from '@sanity/ui-v3'
import {type ReactNode} from 'react'

export function DialogPortalProvider(props: {portalElementId: string; children: ReactNode}) {
  const {children, portalElementId} = props
  const {element, elements} = usePortal()
  const portalElement = elements?.[portalElementId] || element

  return <PortalProvider element={portalElement}>{children}</PortalProvider>
}
