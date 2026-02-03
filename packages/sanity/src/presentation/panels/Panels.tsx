// Slightly modified version of react-resizable-panels
// https://github.com/bvaughn/react-resizable-panels/tree/main/packages/react-resizable-panels

import {
  type CSSProperties,
  type FunctionComponent,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {PresentationPanelsContext} from 'sanity/_singletons'
import {styled} from 'styled-components'

import {
  type ElementMap,
  type InitialDragState,
  type PanelElement,
  type PanelsState,
  type ResizerElement,
} from './types'
import {usePanelsStorage} from './usePanelsStorage'
import {
  getDefaultWidths,
  getNextWidths,
  getOffset,
  getPanelWidth,
  getSortedElements,
  isPanel,
  isResizer,
  validateWidths,
} from './util'

const PanelsWrapper = styled.div`
  display: flex;
  flex-direction: row;
  height: 100%;
  overflow: hidden;
  width: 100%;
`

export const Panels: FunctionComponent<PropsWithChildren> = function ({children}) {
  const panelsEl = useRef<HTMLDivElement | null>(null)

  const [elements, setElements] = useState<ElementMap>(new Map())

  const panels = useMemo(() => getSortedElements(elements).filter(isPanel), [elements])

  const [widths, setWidths] = useState<number[]>([])
  const [activeResizer, setActiveResizer] = useState<string | null>(null)

  const panelsRef = useRef<PanelsState>({
    elements,
    panels,
    widths,
  })

  const getPanelStyle = useCallback(
    (id: string): CSSProperties => {
      return {
        flexGrow: getPanelWidth(panels, id, widths),
        pointerEvents: activeResizer === null ? undefined : 'none',
      }
    },
    [activeResizer, panels, widths],
  )

  const registerElement = useCallback((id: string, data: PanelElement | ResizerElement) => {
    setElements((prev) => {
      if (prev.has(id)) return prev
      const next = new Map(prev)
      next.set(id, data)
      return next
    })
  }, [])
  const unregisterElement = useCallback((id: string) => {
    setElements((prev) => {
      if (!prev.has(id)) return prev
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }, [])

  const dragRef = useRef<InitialDragState>({
    containerWidth: window.innerWidth,
    dragOffset: 0,
    panelAfter: null,
    panelBefore: null,
    resizerIndex: -1,
    resizerRect: null,
    startX: 0,
    widths: [],
  })

  const startDragging = useCallback(
    (id: string, event: MouseEvent) => {
      const elementsArr = getSortedElements(elements)
      const index = elementsArr.findIndex((el) => el.id === id)

      const resizer = elements.get(id)
      if (!resizer || !isResizer(resizer)) return
      const resizeElement = resizer.el.current
      if (!resizeElement) return

      dragRef.current = {
        resizerIndex: index,
        panelBefore: elementsArr.reduce(
          (acc, el, i) => (isPanel(el) && i < index ? el : acc),
          null as PanelElement | null,
        ),
        panelAfter: elementsArr.reduce(
          (acc, el, i) => (acc === null && isPanel(el) && i > index ? el : acc),
          null as PanelElement | null,
        ),
        containerWidth: window.innerWidth,
        startX: event.pageX,
        dragOffset: getOffset(event, resizeElement),
        resizerRect: resizeElement.getBoundingClientRect(),
        widths: panelsRef.current.widths,
      }

      setActiveResizer(id)
    },
    [elements],
  )

  const stopDragging = useCallback(() => {
    setActiveResizer(null)
  }, [])

  const drag = useCallback(
    (id: string, event: MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()

      const {containerWidth, dragOffset, panelBefore, panelAfter, resizerRect} = dragRef.current

      // eslint-disable-next-line no-eq-null
      if (panelBefore == null || panelAfter == null) {
        return
      }

      const resizer = elements.get(id)
      if (!resizer || !isResizer(resizer)) return
      const resizeElement = resizer.el.current
      if (!resizeElement) return

      const offset = getOffset(event, resizeElement, dragOffset, resizerRect)

      if (offset === 0) {
        return
      }

      const {widths: prevWidths} = panelsRef.current
      const rect = panelsEl.current!.getBoundingClientRect()
      const delta = (offset / rect.width) * 100

      const nextWidths = getNextWidths(
        delta,
        containerWidth,
        panelBefore,
        panelAfter,
        panelsRef.current,
        dragRef.current,
      )

      const widthsChanged = prevWidths.some((prevWidth, i) => prevWidth !== nextWidths[i])

      if (widthsChanged) {
        setWidths(nextWidths)
      }
    },
    [elements],
  )

  // For setting the panels state
  useLayoutEffect(() => {
    panelsRef.current.elements = elements
    panelsRef.current.panels = panels
    panelsRef.current.widths = widths
  }, [elements, panels, widths])

  const storage = usePanelsStorage()

  // For setting default sizing when panels are updated
  useLayoutEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const {widths} = panelsRef.current

    if (widths.length === panels.length) {
      return
    }

    const storedWidths = storage.get(panels)

    if (storedWidths) {
      const validatedStoredWidths = validateWidths(panels, storedWidths, window.innerWidth)
      setWidths(validatedStoredWidths)
      return
    }

    const defaultWidths = getDefaultWidths(panels)
    setWidths(defaultWidths)
  }, [storage, panels])

  // For storing current widths in localStorage
  useEffect(() => {
    if (!widths.length) return
    storage.setDebounced(panels, widths)
  }, [storage, panels, widths])

  useLayoutEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const {panels, widths: prevWidths} = panelsRef.current

      const nextWidths = validateWidths(panels, prevWidths, window.innerWidth)

      const widthsChanged = prevWidths.some((prevWidth, i) => prevWidth !== nextWidths[i])
      if (widthsChanged) {
        setWidths(nextWidths)
      }
    })

    resizeObserver.observe(panelsEl.current!)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  const context = useMemo(
    () => ({
      activeResizer,
      drag,
      getPanelStyle,
      registerElement,
      startDragging,
      stopDragging,
      unregisterElement,
    }),
    [
      activeResizer,
      drag,
      getPanelStyle,
      registerElement,
      startDragging,
      stopDragging,
      unregisterElement,
    ],
  )

  return (
    <PresentationPanelsContext.Provider value={context}>
      <PanelsWrapper ref={panelsEl}>{children}</PanelsWrapper>
    </PresentationPanelsContext.Provider>
  )
}
