import {PANE_COLLAPSED_WIDTH, PANE_DEFAULT_MIN_WIDTH} from './constants'
import {_calcPaneResize} from './helpers/_calcPaneResize'
import {_sortElements} from './helpers/_sortElements'
import {
  type PaneConfigOpts,
  type PaneData,
  type PaneResizeCache,
  type PaneResizeData,
} from './types'

export interface PaneLayoutState {
  expandedElement: HTMLElement | null
  panes: PaneData[]
  resizing: boolean
}

export type PaneLayoutStateObserver = (state: PaneLayoutState) => void

export interface PaneLayoutController {
  collapse: (element: HTMLElement) => void
  expand: (element: HTMLElement) => void
  maximize: (element: HTMLElement) => void
  mount: (element: HTMLElement, options: PaneConfigOpts) => () => void
  resize: (type: 'start' | 'move' | 'end', leftElement: HTMLElement, deltaX: number) => void
  setRootElement: (nextRootElement: HTMLElement | null) => void
  setRootWidth: (nextRootWidth: number) => void
  subscribe: (observer: PaneLayoutStateObserver) => () => void
}

export function createPaneLayoutController(): PaneLayoutController {
  const observers: PaneLayoutStateObserver[] = []
  const elements: HTMLElement[] = []
  const optionsMap = new WeakMap<HTMLElement, PaneConfigOpts & {original: PaneConfigOpts}>()
  const userCollapsedElementSet = new Set<HTMLElement>()
  const cache: Partial<PaneResizeCache> = {}

  // Mutable internal state
  let rootElement: HTMLElement | null = null
  let rootWidth = 0
  let expandedElement: HTMLElement | null = null
  let maximizedElement: HTMLElement | null = null
  let resizeDataMap = new Map<HTMLElement, PaneResizeData>()
  let resizing = false

  function collapse(element: HTMLElement) {
    userCollapsedElementSet.add(element)

    if (expandedElement === element) {
      expandedElement = null
    }

    _notifyObservers()
  }

  function expand(element: HTMLElement) {
    userCollapsedElementSet.delete(element)

    expandedElement = element

    _notifyObservers()
  }

  function maximize(element: HTMLElement) {
    maximizedElement = element

    _notifyObservers()
  }

  function mount(element: HTMLElement, options: PaneConfigOpts) {
    optionsMap.set(element, {...options, original: options})

    elements.push(element)

    if (rootElement) {
      _sortElements(rootElement, elements)
    }

    expand(element)

    return () => {
      const idx = elements.indexOf(element)

      if (idx > -1) {
        elements.splice(idx, 1)
      }

      optionsMap.delete(element)

      if (maximizedElement === element) {
        maximizedElement = null
      }

      _notifyObservers()
    }
  }

  function resize(type: 'start' | 'move' | 'end', leftElement: HTMLElement, deltaX: number) {
    if (type === 'start') {
      _setFlexFromWidths()
    }

    const leftIndex = elements.indexOf(leftElement)
    const leftOptions = optionsMap.get(leftElement)

    if (!leftOptions) return

    const rightElement = elements[leftIndex + 1]
    const rightOptions = optionsMap.get(rightElement)

    if (!rightOptions) return

    if (type === 'start') {
      resizing = true

      cache.left = {
        element: leftElement,
        flex: leftOptions.flex || 1,
        width: leftElement.getBoundingClientRect().width,
      }

      cache.right = {
        element: rightElement,
        flex: rightOptions.flex || 1,
        width: rightElement.getBoundingClientRect().width,
      }

      _notifyObservers()
    }

    if (type === 'move' && cache.left && cache.right) {
      resizeDataMap = new Map<HTMLElement, PaneResizeData>()

      const {leftW, rightW, leftFlex, rightFlex} = _calcPaneResize(
        cache as PaneResizeCache,
        leftOptions,
        rightOptions,
        deltaX,
      )

      // update resize cache
      resizeDataMap.set(leftElement, {flex: leftFlex, width: leftW})
      resizeDataMap.set(rightElement, {flex: rightFlex, width: rightW})

      _notifyObservers()
    }

    if (type === 'end') {
      resizing = false

      const leftResizeData = resizeDataMap.get(leftElement)
      const rightResizeData = resizeDataMap.get(rightElement)

      // Update left options
      optionsMap.set(leftElement, {
        ...leftOptions,
        currentMinWidth: 0,
        currentMaxWidth: leftResizeData?.width ?? leftOptions.currentMaxWidth,
        flex: leftResizeData?.flex ?? leftOptions.flex,
      })

      // Update right options
      optionsMap.set(rightElement, {
        ...rightOptions,
        currentMinWidth: 0,
        currentMaxWidth: rightResizeData?.width ?? rightOptions.currentMaxWidth,
        flex: rightResizeData?.flex ?? rightOptions.flex,
      })

      // Reset resize data map
      resizeDataMap = new Map()

      // Reset cache
      delete cache.left
      delete cache.right

      _notifyObservers()
    }
  }

  function setRootElement(nextRootElement: HTMLElement | null) {
    rootElement = nextRootElement
  }

  function setRootWidth(nextRootWidth: number) {
    rootWidth = nextRootWidth
    _notifyObservers()
  }

  function subscribe(observer: PaneLayoutStateObserver) {
    observers.push(observer)

    return () => {
      const idx = observers.indexOf(observer)

      if (idx > -1) {
        observers.splice(idx, 1)
      }
    }
  }

  return {collapse, expand, maximize, mount, resize, setRootElement, setRootWidth, subscribe}

  function _notifyObservers() {
    if (!rootWidth) return

    // Create a reversed array of pane elements, so we can loop over them backwards.
    // Place the expanded element first (so it has the least chance of being collapsed).
    const _elements: HTMLElement[] = []
    for (const element of elements) {
      if (element !== expandedElement) {
        _elements.unshift(element)
      }
    }
    if (expandedElement) {
      _elements.unshift(expandedElement)
    }

    const dataMap = new WeakMap<HTMLElement, PaneData>()
    const len = _elements.length
    const lastElement = _elements[0]
    const collapsedWidth = (len - 1) * PANE_COLLAPSED_WIDTH

    let remaingWidth = rootWidth - collapsedWidth

    for (const element of _elements) {
      const options = optionsMap.get(element)

      if (!options) {
        continue
      }

      const minWidth = options.currentMinWidth || options.minWidth || PANE_DEFAULT_MIN_WIDTH
      const isLast = element === lastElement

      // A pane is collapsed if:
      // - it’s explictly collapsed by the user
      const userCollapsed = userCollapsedElementSet.has(element)
      // - it’s minimum width is larger than the remaining width
      const sizeCollapsed = minWidth > remaingWidth
      // - if the element is not the last (expanded pane)
      const collapsed = isLast ? false : userCollapsed || sizeCollapsed

      const resizeData = resizeDataMap.get(element)

      // Collect pane data
      dataMap.set(element, {
        element: element,
        collapsed: collapsed,
        currentMinWidth: resizeData?.width ?? options.currentMinWidth,
        currentMaxWidth: resizeData?.width ?? options.currentMaxWidth,
        flex: resizeData?.flex ?? options.flex ?? 1,
        maximized: element === maximizedElement,
      })

      // Update remaining width
      if (collapsed) {
        remaingWidth -= PANE_COLLAPSED_WIDTH
      } else {
        remaingWidth -= minWidth - PANE_COLLAPSED_WIDTH
      }
    }

    const panes: PaneData[] = []

    for (const element of elements) {
      const data = dataMap.get(element)

      if (data) panes.push(data)
    }

    // Flexbox only hands out part of the free space when the flex factors of growing panes add up
    // to less than 1, so scale all factors alike to keep each of them at 1 or more
    const minFlex = Math.min(...panes.map((pane) => pane.flex).filter((flex) => flex > 0))

    if (minFlex < 1) {
      for (const pane of panes) pane.flex /= minFlex
    }

    for (const observer of observers) {
      observer({
        expandedElement: expandedElement || elements[elements.length - 1] || null,
        panes,
        resizing,
      })
    }
  }

  // Distribute the total flex of the visible panes by their rendered widths, so the flex values
  // calculated for the two resized panes are consistent with those of the other panes
  function _setFlexFromWidths() {
    const visiblePanes = []
    let totalFlex = 0
    let totalWidth = 0

    for (const element of elements) {
      const options = optionsMap.get(element)
      const width = element.getBoundingClientRect().width

      if (options && width > 0 && !element.hasAttribute('data-pane-collapsed')) {
        visiblePanes.push({element, options, width})
        totalFlex += options.flex || 1
        totalWidth += width
      }
    }

    for (const {element, options, width} of visiblePanes) {
      optionsMap.set(element, {...options, flex: (width / totalWidth) * totalFlex})
    }
  }
}
