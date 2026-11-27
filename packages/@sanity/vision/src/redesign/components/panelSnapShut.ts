import {type RefObject, useCallback} from 'react'

import {PANEL_HEADER_HEIGHT} from './CollapsiblePanel'
import {PANEL_TRANSITION, startLayoutTransition} from './panelTransitions'

/**
 * A collapsible panel left with less body than this under its header, by a drag or a key, snaps
 * shut: that is less than one line of its content
 */
export const MIN_PANEL_BODY_HEIGHT = 24
const COLLAPSE_BELOW = PANEL_HEADER_HEIGHT + MIN_PANEL_BODY_HEIGHT

interface PanelSnapShutOptions {
  /** Holds the split's divider and the panel's collapse toggle */
  containerRef: RefObject<HTMLElement | null>
  handleTestId: string
  toggleTestId: string
  /** The size the panel has when none was dragged; expanding again returns to it */
  defaultSize: number
  /**
   * Collapses the panel, in a layout transition. `restoreSize` is the height to expand to again,
   * the one it had before it was shrunk away, or `undefined` for the default.
   */
  collapse: (restoreSize: number | undefined) => void
}

/**
 * The `onResizeEnd` of a collapsible panel's `ResizableSplit`: a panel resized below one line of
 * body collapses to its header, as if its toggle was pressed
 */
export function usePanelSnapShut(
  options: PanelSnapShutOptions,
): (size: number, startSize: number) => void {
  const {containerRef, handleTestId, toggleTestId, defaultSize, collapse} = options
  return useCallback(
    (size: number, startSize: number) => {
      if (size >= COLLAPSE_BELOW) return
      // The divider is disabled while collapsed, so keyboard focus moves on to the toggle that
      // expands the panel again
      const container = containerRef.current
      if (container?.querySelector(`[data-testid="${handleTestId}"]`) === document.activeElement) {
        container
          ?.querySelector<HTMLElement>(`[data-testid="${toggleTestId}"]`)
          ?.focus({focusVisible: true} as FocusOptions)
      }
      startLayoutTransition(PANEL_TRANSITION, () =>
        collapse(startSize >= COLLAPSE_BELOW && startSize !== defaultSize ? startSize : undefined),
      )
    },
    [collapse, containerRef, defaultSize, handleTestId, toggleTestId],
  )
}
