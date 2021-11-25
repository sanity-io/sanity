import {Box, Card, Code, Flex} from '@sanity/ui'
import React, {memo, useCallback, useEffect, useMemo, useState} from 'react'
import styled from 'styled-components'
import {usePaneLayout} from '../usePaneLayout'
import {PaneDivider} from '../PaneDivider'
import {PaneLayoutContext} from '../PaneLayoutContext'
import {PaneLayoutContextValue} from '../types'
import {PANE_COLLAPSED_WIDTH, PANE_DEFAULT_MIN_WIDTH} from '../constants'
import {createPaneLayoutController, PaneLayoutState} from '../paneLayoutController'

const PaneLayoutRoot = styled(Flex)`
  &[data-resizing] {
    cursor: ew-resize;
  }
`

export default function ResizeStory() {
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const controller = useMemo(() => createPaneLayoutController(), [])
  const collapsed = false
  const [state, setState] = useState<PaneLayoutState>({
    expandedElement: null,
    panes: [],
    resizing: false,
  })

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

  useEffect(() => controller.subscribe(setState), [controller])

  useEffect(() => {
    if (!rootElement) return undefined

    const ro = new ResizeObserver((entries) => {
      controller.setRootWidth(entries[0].contentRect.width)
    })

    ro.observe(rootElement)

    return () => ro.disconnect()
  }, [controller, rootElement])

  return (
    <PaneLayoutContext.Provider value={paneLayout}>
      <PaneLayoutRoot
        data-resizing={state.resizing ? '' : undefined}
        height="fill"
        ref={setRootElement}
      >
        <Pane
          currentMinWidth={undefined}
          // currentMaxWidth={320}
          flex={1}
          minWidth={160}
          maxWidth={320}
        />
        <Pane
          currentMinWidth={undefined}
          // currentMaxWidth={320}
          flex={1}
          minWidth={160}
          maxWidth={320}
        />
        <Pane
          currentMinWidth={undefined}
          // currentMaxWidth={320}
          flex={1}
          minWidth={160}
          maxWidth={320}
        />
        <Pane
          currentMinWidth={320}
          currentMaxWidth={undefined}
          flex={2}
          minWidth={160}
          maxWidth={undefined}
        />
      </PaneLayoutRoot>
    </PaneLayoutContext.Provider>
  )
}

function Pane(props: {
  currentMinWidth?: number
  currentMaxWidth?: number
  flex?: number
  maxWidth?: number
  minWidth?: number
}) {
  const {
    currentMinWidth: currentMinWidthProp,
    currentMaxWidth: currentMaxWidthProp,
    flex: flexProp = 1,
    minWidth: minWidthProp,
    maxWidth: maxWidthProp,
  } = props
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const {collapse, expand, expandedElement, mount, panes, resizing} = usePaneLayout()
  const pane = panes.find((p) => p.element === rootElement)
  const paneIndex = pane && panes.indexOf(pane)
  const nextPane = typeof paneIndex === 'number' ? panes[paneIndex + 1] : undefined
  const isLast = !nextPane
  const expanded = expandedElement === rootElement
  const collapsed = pane?.collapsed || false
  const nextCollapsed = nextPane?.collapsed || false
  const flex = pane?.flex ?? flexProp
  const currentMinWidth = pane?.currentMinWidth ?? currentMinWidthProp
  const currentMaxWidth = pane?.currentMaxWidth ?? currentMaxWidthProp

  useEffect(() => {
    if (!rootElement) {
      return undefined
    }

    return mount(rootElement, {
      currentMinWidth: currentMinWidthProp,
      currentMaxWidth: currentMaxWidthProp,
      flex: flexProp,
      id: String(paneIndex),
      minWidth: minWidthProp,
      maxWidth: maxWidthProp,
    })
  }, [
    currentMinWidthProp,
    currentMaxWidthProp,
    flexProp,
    minWidthProp,
    maxWidthProp,
    mount,
    paneIndex,
    rootElement,
  ])

  const minWidth = useMemo(() => {
    if (collapsed) return PANE_COLLAPSED_WIDTH

    if (currentMinWidth === 0) {
      return minWidthProp || PANE_DEFAULT_MIN_WIDTH
    }

    return currentMinWidth || minWidthProp || PANE_DEFAULT_MIN_WIDTH
  }, [collapsed, currentMinWidth, minWidthProp])

  const maxWidth = useMemo(() => {
    if (collapsed) return PANE_COLLAPSED_WIDTH

    if (maxWidthProp !== undefined) {
      return currentMaxWidth ?? maxWidthProp
    }

    return isLast ? undefined : currentMaxWidth
  }, [collapsed, currentMaxWidth, isLast, maxWidthProp])

  const handleCollapse = useCallback(() => {
    if (!rootElement) return
    collapse(rootElement)
  }, [collapse, rootElement])

  const handleExpand = useCallback(() => {
    if (!rootElement) return
    expand(rootElement)
  }, [expand, rootElement])

  return (
    <PaneView
      collapsed={collapsed}
      currentMinWidth={currentMinWidth}
      currentMaxWidth={currentMaxWidth}
      expanded={expanded}
      flex={flex}
      index={paneIndex}
      isLast={isLast}
      minWidth={minWidth}
      maxWidth={maxWidth}
      nextCollapsed={nextCollapsed}
      onCollapse={handleCollapse}
      onExpand={handleExpand}
      resizing={resizing}
      rootElement={rootElement}
      setRootElement={setRootElement}
    />
  )
}

interface PaneViewProps {
  collapsed: boolean
  currentMinWidth?: number
  currentMaxWidth?: number
  expanded: boolean
  flex: number
  index?: number
  isLast: boolean
  minWidth?: number
  maxWidth?: number
  nextCollapsed: boolean
  onCollapse: () => void
  onExpand: () => void
  resizing: boolean
  rootElement: HTMLDivElement | null
  setRootElement: (rootElement: HTMLDivElement | null) => void
}

const PaneViewRoot = styled(Card)`
  box-shadow: 0 0 0 1px var(--card-border-color) !important;

  &[data-resizing] {
    pointer-events: none;
  }

  & + & {
    margin-left: 1px;
  }
`

const PaneView = memo(function PaneView(props: PaneViewProps) {
  const {
    collapsed,
    currentMinWidth,
    currentMaxWidth,
    expanded,
    flex,
    index,
    isLast,
    minWidth,
    maxWidth,
    nextCollapsed,
    onCollapse,
    onExpand,
    resizing,
    rootElement,
    setRootElement,
  } = props

  const style = useMemo(
    () => ({
      flex,
      minWidth,
      maxWidth: maxWidth === Infinity ? undefined : maxWidth,
    }),
    [flex, minWidth, maxWidth]
  )

  const handleClick = useCallback(() => {
    if (collapsed) onExpand()
    else onCollapse()
  }, [collapsed, onCollapse, onExpand])

  return (
    <>
      <PaneViewRoot
        data-as="button"
        data-resizing={resizing ? '' : undefined}
        id={`pane-${index}`}
        onClick={handleClick}
        overflow="hidden"
        ref={setRootElement}
        style={style}
        tone={expanded ? 'primary' : undefined}
      >
        {!collapsed && (
          <Box padding={4}>
            <Code size={1}>
              {[
                `#${index}`,
                `collapsed=${collapsed}`,
                `currentMinWidth=${currentMinWidth}`,
                `currentMaxWidth=${currentMaxWidth}`,
                `flex=${flex}`,
                `minWidth=${minWidth}`,
                `maxWidth=${maxWidth}`,
              ].join('\n')}
            </Code>
          </Box>
        )}
      </PaneViewRoot>
      {!isLast && <PaneDivider disabled={collapsed || nextCollapsed} element={rootElement} />}
    </>
  )
})
