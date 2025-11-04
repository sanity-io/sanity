import {type CardProps, useElementRect} from '@sanity/ui'
import {type HTMLProps, useEffect, useMemo, useState} from 'react'
import {PaneLayoutContext} from 'sanity/_singletons'

import {Root} from './PaneLayout.styles'
import {createPaneLayoutController, type PaneLayoutState} from './paneLayoutController'
import {type PaneLayoutContextValue} from './types'

/**
 *
 * @hidden
 * @beta This API will change. DO NOT USE IN PRODUCTION.
 */
export interface PaneLayoutProps {
  minWidth?: number
  onCollapse?: () => void
  onExpand?: () => void
}

/**
 *
 * @hidden
 * @beta This API will change. DO NOT USE IN PRODUCTION.
 */
export function PaneLayout(
  props: PaneLayoutProps &
    CardProps &
    Omit<HTMLProps<HTMLDivElement>, 'as' | 'height' | 'ref' | 'wrap'>,
) {
  const {children, minWidth, onCollapse, onExpand, ...restProps} = props
  const [controller] = useState(() => createPaneLayoutController())
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
    [collapsed, controller, state.expandedElement, state.panes, state.resizing],
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
