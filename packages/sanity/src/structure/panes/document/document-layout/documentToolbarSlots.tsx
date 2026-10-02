import {type ComponentType, type ReactNode, useCallback} from 'react'

import {type DocumentActionsPlacement} from '../statusBar/documentActionsPlacement'

/**
 * @internal
 */
export interface DocumentToolbarSlotProps {
  renderDefault: () => ReactNode
}

/**
 * A slot component receives the studio's own content for that slot as `renderDefault`, so it can
 * replace it, wrap it, or suppress it by rendering nothing.
 *
 * @internal
 */
export type DocumentToolbarSlotComponent = ComponentType<DocumentToolbarSlotProps>

/**
 * The named regions of the document toolbar a host can render into.
 *
 * @internal
 */
export interface DocumentToolbarSlots {
  /** The status line, and the revision status line while a revision is displayed. */
  documentStatus?: DocumentToolbarSlotComponent
  /** The document badges. */
  documentBadges?: DocumentToolbarSlotComponent
  /** The primary document action and the overflow menu. */
  documentActions?: DocumentToolbarSlotComponent
}

/**
 * Host-facing options for the bar carrying the document status, badges and actions.
 *
 * @internal
 */
export interface DocumentActionsBarOptions {
  /**
   * Where the bar sits relative to the form. Defaults to `'bottom'`. `'top'` renders it above
   * the form and leaves no pane footer.
   */
  actionsPlacement?: DocumentActionsPlacement
  /** Host-supplied replacements for the named regions of the bar. */
  actionsSlots?: DocumentToolbarSlots
}

interface DocumentToolbarSlotContentProps {
  slot: DocumentToolbarSlotComponent | undefined
  children: ReactNode
}

/** @internal */
export function DocumentToolbarSlotContent(props: DocumentToolbarSlotContentProps) {
  const {slot: Slot, children} = props
  const renderDefault = useCallback(() => children, [children])

  if (Slot) {
    return <Slot renderDefault={renderDefault} />
  }

  return children
}
