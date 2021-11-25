import {CardProps, useElementRect} from '@sanity/ui'
import React, {useMemo, useState, useEffect} from 'react'
import {PaneLayoutContext} from './PaneLayoutContext'
import {PaneLayoutContextValue} from './types'
import {Root} from './PaneLayout.styles'
import {createPaneLayoutController, PaneLayoutState} from './paneLayoutController'

/**
 * @beta This API will change. DO NOT USE IN PRODUCTION.
 */
export interface PaneLayoutProps {
  minWidth?: number
  onCollapse?: () => void
  onExpand?: () => void
}

/**
 * @beta This API will change. DO NOT USE IN PRODUCTION.
 */
export function PaneLayout(
  props: PaneLayoutProps &
    CardProps &
    Omit<React.HTMLProps<HTMLDivElement>, 'as' | 'height' | 'ref' | 'wrap'>
) {
  const {children, minWidth, onCollapse, onExpand, ...restProps} = props
  const controller = useMemo(() => createPaneLayoutController(), [])
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const rootRect = useElementRect(rootElement)
  const width = rootRect?.width || 0
  const collapsed = width === undefined || !minWidth ? undefined : width < minWidth
  const [state, setState] = useState<PaneLayoutState>({
    expandedElement: null,
    panes: [],
    resizing: false,
  })

  // Set root element
  useEffect(() => controller.setRootElement(rootElement), [controller, rootElement])

  // Set root size
  useEffect(() => controller.setRootWidth(width), [controller, width])

  // Subscribe to state changes
  useEffect(() => controller.subscribe(setState), [controller])

  // Call the `onCollapse` and `onExpand` callbacks as the `collapsed` boolean changes
  useEffect(() => {
    if (collapsed === undefined) return
    if (collapsed && onCollapse) onCollapse()
    if (!collapsed && onExpand) onExpand()
  }, [collapsed, onCollapse, onExpand])

  // This is the context value that gives each pane the information they need
  const paneLayout: PaneLayoutContextValue = useMemo(
    () => ({
      collapse: controller.collapse,
      collapsed,
      expand: controller.expand,
      expandedElement: state.expandedElement,
      mount: controller.mount,
      panes: state.panes,
      resize: controller.resize,
      resizing: state.resizing,
    }),
    [collapsed, controller, state.expandedElement, state.panes, state.resizing]
  )

  return (
    <PaneLayoutContext.Provider value={paneLayout}>
      <Root
        data-ui="PaneLayout"
        {...restProps}
        data-collapsed={collapsed ? '' : undefined}
        // The `data-resizing` attribute is used to improve cursor behavior
        data-resizing={state.resizing ? '' : undefined}
        // The `data-mounted` attribute is used to fade in the layout and prevent flash of
        // non-collapsed panes
        data-mounted={width ? '' : undefined}
        ref={setRootElement}
      >
        {children}
      </Root>
    </PaneLayoutContext.Provider>
  )
}
