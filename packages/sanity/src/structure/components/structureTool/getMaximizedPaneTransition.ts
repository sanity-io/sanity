import {LOADING_PANE} from '../../constants'
import {type PaneNode} from '../../types'

/** The subset of `PaneData` the maximize-sync decision depends on. */
interface MaximizablePaneData {
  key: string
  groupIndex: number
  siblingIndex: number
  selected: boolean
  pane: PaneNode | typeof LOADING_PANE
}

/** @internal */
export type MaximizedPaneTransition<TPaneData extends MaximizablePaneData> =
  /**
   * The snapshot is transient (intent resolution in flight or loading
   * placeholders present): do nothing — don't even record the selected index,
   * so the next settled snapshot is compared against the last settled one.
   */
  | {type: 'skip-transient'}
  /** Settled snapshot, no maximize change: record the selected index only. */
  | {type: 'keep'; selectedIndex: number}
  /** Settled snapshot: record the selected index and update the maximized pane. */
  | {type: 'set'; pane: TPaneData | null; selectedIndex: number}

/**
 * Pure decision for `StructureTool`'s maximize-sync effect, extracted so the
 * "navigation churn cannot drop the maximize state" behavior is directly
 * testable.
 *
 * While pane or intent resolution is in flight the pane set is transient:
 * loading placeholders replace real panes, and intent states have no router
 * panes at all (collapsing the set to the root). Acting on such a snapshot
 * could drop the maximize state (the maximized key appears missing) or follow
 * the wrong pane — so transient snapshots are skipped wholesale.
 *
 * On settled snapshots:
 * - a non-document maximized pane clears the maximize state (focus only works
 *   with documents)
 * - if the selection moved, the maximize state follows the newly selected pane
 * - if the maximized pane no longer exists, fall back to the document pane at
 *   the same group/sibling position, or clear
 *
 * @internal
 */
export function getMaximizedPaneTransition<TPaneData extends MaximizablePaneData>(options: {
  isResolvingIntent: boolean
  paneDataItems: TPaneData[]
  maximizedPane: TPaneData | null
  previousSelectedIndex: number
}): MaximizedPaneTransition<TPaneData> {
  const {isResolvingIntent, paneDataItems, maximizedPane, previousSelectedIndex} = options

  if (isResolvingIntent || paneDataItems.some((pane) => pane.pane === LOADING_PANE)) {
    return {type: 'skip-transient'}
  }

  const selectedIndex = paneDataItems.findIndex((pane) => pane.selected)

  if (!maximizedPane) return {type: 'keep', selectedIndex}

  // Clear focus if the maximised pane is not a document pane (focus only works with documents)
  if (maximizedPane.pane !== LOADING_PANE && maximizedPane.pane.type !== 'document') {
    return {type: 'set', pane: null, selectedIndex}
  }

  // When navigating in focus mode, update focus to follow the newly selected pane
  // This ensures opening a document to the right works correctly even when they were opened previously
  if (selectedIndex !== -1 && selectedIndex !== previousSelectedIndex) {
    return {type: 'set', pane: paneDataItems[selectedIndex], selectedIndex}
  }

  // Clean up or find fallback when maximised pane no longer exists
  const isMaximizedPanePresent = paneDataItems.some((pane) => pane.key === maximizedPane.key)
  if (!isMaximizedPanePresent) {
    const fallbackPane = paneDataItems.find(
      (pane) =>
        pane.groupIndex === maximizedPane.groupIndex &&
        pane.siblingIndex === maximizedPane.siblingIndex &&
        pane.pane !== LOADING_PANE &&
        pane.pane.type === 'document',
    )
    return {type: 'set', pane: fallbackPane || null, selectedIndex}
  }

  return {type: 'keep', selectedIndex}
}
