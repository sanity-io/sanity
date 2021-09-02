import {CardProps, useElementRect} from '@sanity/ui'
import React, {useMemo, useCallback, useState, useEffect, useRef} from 'react'
import {PaneLayoutContext} from './PaneLayoutContext'
import {_calcPaneResize, _sortPaneConfigs} from './_helpers'
import {PANE_COLLAPSED_WIDTH, PANE_DEFAULT_MIN_WIDTH} from './constants'
import {PaneData, PaneResizeCache} from './types'
import {Root} from './PaneLayout.styles'

interface PaneLayoutProps {
  minWidth?: number
  onCollapse?: () => void
  onExpand?: () => void
}

interface PaneResizeData {
  currentMaxWidth: number
  flex: number
}

interface PaneConfig {
  element: HTMLElement
  opts: {
    currentMaxWidth?: number
    flex?: number
    minWidth?: number
    maxWidth?: number
  }
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
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const rootRect = useElementRect(rootElement)
  const [paneConfigs, setPaneConfigs] = useState<PaneConfig[]>([])
  const paneConfigsRef = useRef(paneConfigs)
  const [collapsedElements, setCollapsedElements] = useState<HTMLElement[]>([])
  const [expandedElement, setExpandedElement] = useState<HTMLElement | null>(null)
  const width = rootRect?.width
  const collapsed = width === undefined || !minWidth ? undefined : width < minWidth
  const [resizeMap, setResizeMap] = useState(new Map<HTMLElement, PaneResizeData>())
  const resizeMapRef = useRef(resizeMap)
  const cacheRef = useRef<Partial<PaneResizeCache>>({})
  const [resizing, setResizing] = useState(false)

  const collapse = useCallback(
    (element: HTMLElement) => {
      setCollapsedElements((v) => {
        if (!v.includes(element)) return v.concat([element])
        return v
      })

      if (expandedElement === element) {
        setExpandedElement(null)
      }
    },
    [expandedElement]
  )

  const expand = useCallback((element: HTMLElement) => {
    setExpandedElement(element)
    setCollapsedElements((v) => {
      return v.filter((e) => e !== element)
    })
  }, [])

  const resize = useCallback(
    (type: 'start' | 'move' | 'end', element: HTMLElement, deltaX: number) => {
      const cache = cacheRef.current
      const panes = paneConfigsRef.current
      const leftPane = panes.find((p) => p.element === element)

      if (!leftPane) {
        return
      }

      const leftPaneIndex = panes.indexOf(leftPane)
      const rightPane = panes[leftPaneIndex + 1]

      if (!rightPane) {
        return
      }

      if (type === 'start') {
        setResizing(true)

        cache.left = {
          element: leftPane.element,
          flex: leftPane.opts.flex || 1,
          width: leftPane.element.offsetWidth,
        }

        cache.right = {
          element: rightPane.element,
          flex: rightPane.opts.flex || 1,
          width: rightPane.element.offsetWidth,
        }
      }

      if (type === 'move' && cache.left && cache.right) {
        const _resizeMap = new Map<HTMLElement, PaneResizeData>()

        const {leftW, rightW, leftFlex, rightFlex} = _calcPaneResize(
          cache as PaneResizeCache,
          leftPane,
          rightPane,
          deltaX
        )

        _resizeMap.set(leftPane.element, {currentMaxWidth: leftW, flex: leftFlex})
        _resizeMap.set(rightPane.element, {currentMaxWidth: rightW, flex: rightFlex})

        resizeMapRef.current = _resizeMap

        setResizeMap(_resizeMap)
      }

      if (type === 'end') {
        setResizing(false)

        const _resizeMap = resizeMapRef.current

        setPaneConfigs((v) => {
          const nextPaneConfigs = v.map((p) => {
            if (p === leftPane || p === rightPane) {
              const r = _resizeMap.get(p.element)

              return {
                ...p,
                opts: {
                  ...p.opts,
                  currentMaxWidth: r?.currentMaxWidth || p.opts.currentMaxWidth,
                  flex: r?.flex || p.opts.flex,
                },
              }
            }

            return p
          })

          paneConfigsRef.current = nextPaneConfigs

          return nextPaneConfigs
        })

        setResizeMap(new Map())
      }
    },
    []
  )

  const mount = useCallback(
    (
      element: HTMLElement,
      opts: {currentMaxWidth?: number; flex?: number; minWidth?: number; maxWidth?: number}
    ) => {
      let nextPaneConfigs = paneConfigsRef.current.concat([{element, opts}])
      _sortPaneConfigs(rootElement, nextPaneConfigs)
      paneConfigsRef.current = nextPaneConfigs
      setPaneConfigs(nextPaneConfigs)

      return () => {
        nextPaneConfigs = paneConfigsRef.current.filter((i) => i.element !== element)
        paneConfigsRef.current = nextPaneConfigs
        setPaneConfigs(nextPaneConfigs)
      }
    },
    [rootElement]
  )

  const panes: PaneData[] = useMemo(() => {
    if (!width) {
      return []
    }

    // Insert the expanded pane config at the end,
    // so it has the least chance of being defined as collapsed
    const expandedPaneConfig = paneConfigs.find((pc) => pc.element === expandedElement)
    const _paneConfigs = paneConfigs.filter((pc) => pc !== expandedPaneConfig)
    if (expandedPaneConfig) {
      _paneConfigs.push(expandedPaneConfig)
    }

    const paneMap = new WeakMap<PaneConfig, PaneData>()
    const len = paneConfigs.length
    const collapsedIndexes: number[] = []
    const lastIndex = len - 1
    const collapsedWidth = lastIndex * 51

    let remaingWidth = width - collapsedWidth

    for (let i = lastIndex; i >= 0; i -= 1) {
      const config = _paneConfigs[i]
      const paneMinWidth = config.opts.minWidth || PANE_DEFAULT_MIN_WIDTH

      if (paneMinWidth <= remaingWidth && !collapsedElements.includes(config.element)) {
        remaingWidth -= paneMinWidth - PANE_COLLAPSED_WIDTH
      } else {
        remaingWidth -= PANE_COLLAPSED_WIDTH
        collapsedIndexes.push(i)
      }
    }

    for (let i = 0; i < len; i += 1) {
      const config = _paneConfigs[i]
      const r = resizeMap.get(config.element)

      paneMap.set(config, {
        element: config.element,
        collapsed: i < lastIndex && collapsedIndexes.includes(i),
        currentMaxWidth: r?.currentMaxWidth || config.opts.currentMaxWidth || 0,
        flex: r?.flex || config.opts.flex || 1,
      })
    }

    return paneConfigs.map((config) => paneMap.get(config)).filter(Boolean) as PaneData[]
  }, [collapsedElements, expandedElement, resizeMap, paneConfigs, width])

  useEffect(() => {
    if (collapsed === undefined) return
    if (collapsed && onCollapse) onCollapse()
    if (!collapsed && onExpand) onExpand()
  }, [collapsed, onCollapse, onExpand])

  const contextValue = useMemo(
    () => ({
      collapse,
      collapsed,
      expand,
      mount,
      resize,
      panes,
    }),
    [collapse, collapsed, expand, mount, resize, panes]
  )

  return (
    <PaneLayoutContext.Provider value={contextValue}>
      <Root
        data-ui="PaneLayout"
        {...restProps}
        data-collapsed={collapsed ? '' : undefined}
        data-resizing={resizing ? '' : undefined}
        data-mounted={width ? '' : undefined}
        ref={setRootElement}
      >
        {children}
      </Root>
    </PaneLayoutContext.Provider>
  )
}
