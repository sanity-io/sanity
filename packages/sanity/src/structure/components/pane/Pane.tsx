import {BoundaryElementProvider, Card, type CardProps, Code, Flex} from '@sanity/ui'
import {
  type ForwardedRef,
  forwardRef,
  type HTMLProps,
  type ReactNode,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {IsLastPaneProvider, LegacyLayerProvider} from 'sanity'
import {PaneContext} from 'sanity/_singletons'
import {styled} from 'styled-components'

import {PANE_COLLAPSED_WIDTH, PANE_DEBUG, PANE_DEFAULT_MIN_WIDTH} from './constants'
import {PaneDivider} from './PaneDivider'
import {usePaneLayout} from './usePaneLayout'

interface PaneProps {
  children?: ReactNode
  currentMinWidth?: number
  currentMaxWidth?: number
  flex?: number
  id: string
  minWidth?: number
  maxWidth?: number
  selected?: boolean
}

const Root = styled(Card)`
  outline: none;

  // NOTE: This will render a border to the right side of each pane
  // without taking up physical space.
  box-shadow: 1px 0 0 var(--card-border-color);
`

/**
 * @hidden
 * @internal
 */
export const Pane = forwardRef(function Pane(
  props: PaneProps &
    Omit<CardProps, 'as' | 'overflow'> &
    Omit<HTMLProps<HTMLDivElement>, 'as' | 'height' | 'hidden' | 'id' | 'style'>,
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const {
    children,
    currentMinWidth: currentMinWidthProp,
    currentMaxWidth: currentMaxWidthProp,
    flex: flexProp = 1,
    id,
    minWidth: minWidthProp,
    maxWidth: maxWidthProp,
    selected = false,
    ...restProps
  } = props
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const {
    collapse,
    collapsed: layoutCollapsed,
    expand,
    expandedElement,
    mount,
    panes,
  } = usePaneLayout()
  const pane = panes.find((p) => p.element === rootElement)
  const paneIndex = pane && panes.indexOf(pane)
  const nextPane = typeof paneIndex === 'number' ? panes[paneIndex + 1] : undefined
  const isLast = paneIndex === panes.length - 1
  const expanded = expandedElement === rootElement
  const collapsed = layoutCollapsed ? false : pane?.collapsed || false
  const nextCollapsed = nextPane?.collapsed || false
  const ref = useRef<HTMLDivElement | null>(null)
  const flex = pane?.flex ?? flexProp
  const currentMinWidth = pane?.currentMinWidth ?? currentMinWidthProp
  const currentMaxWidth = pane?.currentMaxWidth ?? currentMaxWidthProp

  // Forward ref to parent
  useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(forwardedRef, () => ref.current)

  const setRef = useCallback((refValue: HTMLDivElement | null) => {
    setRootElement(refValue)
    ref.current = refValue
  }, [])

  useLayoutEffect(() => {
    if (!rootElement) return undefined
    return mount(rootElement, {
      currentMinWidth: currentMinWidthProp,
      currentMaxWidth: currentMaxWidthProp,
      flex: flexProp,
      id,
      minWidth: minWidthProp,
      maxWidth: maxWidthProp,
    })
  }, [
    currentMinWidthProp,
    currentMaxWidthProp,
    flexProp,
    id,
    minWidthProp,
    maxWidthProp,
    mount,
    rootElement,
  ])

  const handleCollapse = useCallback(() => {
    if (!rootElement) return
    collapse(rootElement)
  }, [collapse, rootElement])

  const handleExpand = useCallback(() => {
    if (!rootElement) return
    expand(rootElement)
  }, [expand, rootElement])

  const contextValue = useMemo(
    () => ({
      collapse: handleCollapse,
      collapsed: layoutCollapsed ? false : collapsed,
      expand: handleExpand,
      index: paneIndex,
      isLast,
      rootElement,
    }),
    [collapsed, handleCollapse, handleExpand, isLast, layoutCollapsed, paneIndex, rootElement],
  )

  const minWidth = useMemo(() => {
    if (layoutCollapsed) {
      return undefined
    }

    if (collapsed) return PANE_COLLAPSED_WIDTH

    if (currentMinWidth === 0) {
      return minWidthProp || PANE_DEFAULT_MIN_WIDTH
    }

    if (isLast) {
      return minWidthProp || PANE_DEFAULT_MIN_WIDTH
    }

    return currentMinWidth || minWidthProp || PANE_DEFAULT_MIN_WIDTH
  }, [collapsed, currentMinWidth, isLast, layoutCollapsed, minWidthProp])

  const maxWidth = useMemo(() => {
    if (collapsed) return PANE_COLLAPSED_WIDTH

    if (layoutCollapsed && isLast) {
      return undefined
    }

    if (isLast) {
      if (maxWidthProp) {
        return currentMaxWidth ?? maxWidthProp
      }

      return undefined
    }

    return currentMaxWidth ?? maxWidthProp
  }, [collapsed, currentMaxWidth, isLast, layoutCollapsed, maxWidthProp])

  const hidden = layoutCollapsed && !isLast

  const divider = useMemo(
    () =>
      !isLast &&
      !layoutCollapsed && (
        <LegacyLayerProvider zOffset="paneResizer">
          <PaneDivider disabled={collapsed || nextCollapsed} element={rootElement} />
        </LegacyLayerProvider>
      ),
    [collapsed, isLast, layoutCollapsed, nextCollapsed, rootElement],
  )

  const style = useMemo(
    () => ({
      flex,
      minWidth,
      maxWidth: maxWidth === Infinity ? undefined : maxWidth,
    }),
    [flex, minWidth, maxWidth],
  )

  return (
    <>
      <LegacyLayerProvider zOffset="pane">
        <PaneContext.Provider value={contextValue}>
          <IsLastPaneProvider isLastPane={isLast}>
            <Root
              data-testid="pane"
              data-ui="Pane"
              tone="inherit"
              hidden={hidden}
              id={id}
              overflow={layoutCollapsed ? undefined : 'hidden'}
              {...restProps}
              data-pane-collapsed={collapsed ? '' : undefined}
              data-pane-index={paneIndex}
              data-pane-selected={selected ? '' : undefined}
              ref={setRef}
              style={style}
            >
              {PANE_DEBUG && (
                <Card padding={4} tone={expanded ? 'primary' : 'caution'}>
                  <Code size={1}>
                    {[
                      `#${paneIndex}`,
                      `collapsed=${collapsed}`,
                      `currentMinWidth=${currentMinWidth}`,
                      `currentMaxWidth=${currentMaxWidth}`,
                      `flex=${flex}`,
                      `minWidth=${minWidth}`,
                      `maxWidth=${maxWidth}`,
                    ].join('\n')}
                  </Code>
                </Card>
              )}

              <BoundaryElementProvider element={rootElement}>
                {!hidden && (
                  <Flex direction="column" height="fill">
                    {children}
                  </Flex>
                )}
              </BoundaryElementProvider>
            </Root>
          </IsLastPaneProvider>
        </PaneContext.Provider>
      </LegacyLayerProvider>

      {divider}
    </>
  )
})
