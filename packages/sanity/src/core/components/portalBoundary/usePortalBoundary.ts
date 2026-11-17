import {usePortal} from '@sanity/ui'
import {useContext} from 'react'
import {PortalBoundaryContext} from 'sanity/_singletons'

/**
 * The boundary declared by the nearest {@link PortalBoundaryProvider}, provided the caller still
 * renders into the portal it was declared for. Returns `null` when no surface has declared a
 * boundary, or when an intermediate `PortalProvider` (a custom input's body-level dialog) has
 * moved the caller's portaled content out of that surface — the boundary then no longer describes
 * where the content is visible. A surface whose portal target has not mounted yet declares
 * nothing.
 *
 * @internal
 */
export function usePortalBoundary(): HTMLElement | null {
  const declared = useContext(PortalBoundaryContext)
  const {element: portalElement} = usePortal()

  if (!declared?.portalElement || declared.portalElement !== portalElement) {
    return null
  }

  return declared.element
}
