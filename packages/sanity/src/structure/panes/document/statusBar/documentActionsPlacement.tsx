import {type Placement} from '@sanity/ui'
import {type ReactNode, useContext} from 'react'
import {type DocumentActionsPlacement, DocumentActionsPlacementContext} from 'sanity/_singletons'

import {
  POPOVER_FALLBACK_PLACEMENTS_BOTTOM_BAR,
  POPOVER_FALLBACK_PLACEMENTS_TOP_BAR,
} from './dialogs/constants'

export type {DocumentActionsPlacement}

/**
 * Mount this around the document actions bar to tell its popovers, tooltips and dialogs
 * which direction to open in. Bottom-placed bars (the default) open upward, unchanged from
 * today; a bar mounted at the top of the document form should pass `placement="top"` so its
 * overlays mirror and open downward instead.
 *
 * @internal
 */
export function DocumentActionsPlacementProvider(props: {
  placement: DocumentActionsPlacement
  children: ReactNode
}) {
  const {placement, children} = props

  return (
    <DocumentActionsPlacementContext.Provider value={placement}>
      {children}
    </DocumentActionsPlacementContext.Provider>
  )
}

/**
 * @internal
 */
export function useDocumentActionsPlacement(): DocumentActionsPlacement {
  return useContext(DocumentActionsPlacementContext)
}

/**
 * @internal
 */
export function getMirroredPlacement(barPlacement: DocumentActionsPlacement): 'top' | 'bottom' {
  return barPlacement === 'top' ? 'bottom' : 'top'
}

/**
 * @internal
 */
export function getMirroredEndPlacement(
  barPlacement: DocumentActionsPlacement,
): 'top-end' | 'bottom-end' {
  return barPlacement === 'top' ? 'bottom-end' : 'top-end'
}

/**
 * @internal
 */
export function getMirroredFallbackPlacements(barPlacement: DocumentActionsPlacement): Placement[] {
  return barPlacement === 'top'
    ? POPOVER_FALLBACK_PLACEMENTS_TOP_BAR
    : POPOVER_FALLBACK_PLACEMENTS_BOTTOM_BAR
}
