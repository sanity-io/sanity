import {LegacyLayerProvider} from '@sanity/base/components'
import {useForwardedRef, Card, CardProps, Flex, BoundaryElementProvider} from '@sanity/ui'
import React, {forwardRef, useMemo, useState, useCallback, useEffect} from 'react'
import styled from 'styled-components'
import {PANE_COLLAPSED_WIDTH, PANE_DEFAULT_MIN_WIDTH} from './constants'
import {PaneContext} from './PaneContext'
import {PaneDivider} from './PaneDivider'
import {usePaneLayout} from './usePaneLayout'

interface PaneProps {
  children?: React.ReactNode
  currentMaxWidth?: number
  flex?: number
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
 * @beta This API will change. DO NOT USE IN PRODUCTION.
 */
export const Pane = forwardRef(function Pane(
  props: PaneProps &
    Omit<CardProps, 'as' | 'height'> &
    Omit<React.HTMLProps<HTMLDivElement>, 'as' | 'height'>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const {
    children,
    currentMaxWidth: currentMaxWidthProp,
    flex: flexProp = 1,
    minWidth,
    maxWidth,
    selected = false,
    ...restProps
  } = props
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const {collapse, collapsed: layoutCollapsed, expand, mount, panes} = usePaneLayout()
  const pane = panes.find((p) => p.element === rootElement)
  const paneIndex = pane && panes.indexOf(pane)
  const isLast = paneIndex === panes.length - 1
  const collapsed = pane?.collapsed || false
  const forwardedRef = useForwardedRef(ref)
  const flex = pane?.flex || flexProp
  const currentMaxWidth = pane?.currentMaxWidth || currentMaxWidthProp

  const setRef = useCallback(
    (refValue: HTMLDivElement | null) => {
      setRootElement(refValue)
      forwardedRef.current = refValue
    },
    [forwardedRef]
  )

  useEffect(() => {
    if (!rootElement) return undefined
    return mount(rootElement, {
      currentMaxWidth: currentMaxWidthProp,
      flex: flexProp,
      minWidth,
      maxWidth,
    })
  }, [currentMaxWidthProp, flexProp, minWidth, maxWidth, mount, rootElement])

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
      collapsed,
      expand: handleExpand,
      index: paneIndex,
      isLast,
      rootElement,
    }),
    [collapsed, handleCollapse, handleExpand, isLast, paneIndex, rootElement]
  )

  const style = useMemo(
    () =>
      layoutCollapsed
        ? {flex: 1}
        : {
            flex,
            minWidth: collapsed ? PANE_COLLAPSED_WIDTH : minWidth || PANE_DEFAULT_MIN_WIDTH,
            // eslint-disable-next-line no-nested-ternary
            maxWidth: collapsed
              ? PANE_COLLAPSED_WIDTH
              : // eslint-disable-next-line no-nested-ternary
              maxWidth
              ? Math.min(currentMaxWidth || maxWidth, maxWidth || currentMaxWidth!)
              : isLast
              ? undefined
              : currentMaxWidth,
          },
    [collapsed, currentMaxWidth, flex, isLast, layoutCollapsed, minWidth, maxWidth]
  )

  const hidden = layoutCollapsed && !isLast

  const divider = useMemo(
    () =>
      !isLast &&
      !layoutCollapsed && (
        <LegacyLayerProvider zOffset="paneResizer">
          <PaneDivider disabled={collapsed} element={rootElement} />
        </LegacyLayerProvider>
      ),
    [collapsed, isLast, layoutCollapsed, rootElement]
  )

  return (
    <>
      <LegacyLayerProvider zOffset="pane">
        <PaneContext.Provider value={contextValue}>
          <Root
            data-testid="pane"
            tone="inherit"
            hidden={hidden}
            overflow={layoutCollapsed ? undefined : 'hidden'}
            {...restProps}
            data-pane-collapsed={collapsed ? '' : undefined}
            data-pane-index={paneIndex}
            data-pane-selected={selected ? '' : undefined}
            ref={setRef}
            style={style}
          >
            <BoundaryElementProvider element={rootElement}>
              {!hidden && (
                <Flex direction="column" height="fill">
                  {children}
                </Flex>
              )}
            </BoundaryElementProvider>
          </Root>
        </PaneContext.Provider>
      </LegacyLayerProvider>

      {divider}
    </>
  )
})
