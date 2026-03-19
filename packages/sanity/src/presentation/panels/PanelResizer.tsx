import {
  type FunctionComponent,
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react'
import {PresentationPanelsContext} from 'sanity/_singletons'

import {resizer, resizerInner, resizerInnerDisabled} from './PanelResizer.css'
import {usePanelId} from './usePanelId'

export const PanelResizer: FunctionComponent<{
  id?: string
  order: number
  disabled?: boolean
}> = function ({id: propId, order, disabled = false}) {
  const el = useRef<HTMLDivElement>(null)

  const context = useContext(PresentationPanelsContext)

  if (context === null) {
    throw Error(`Panel components must be rendered within a PanelGroup container`)
  }

  const id = usePanelId(propId)

  const {activeResizer, drag, startDragging, stopDragging, registerElement, unregisterElement} =
    context

  const isDragging = activeResizer === id

  if (context === null) {
    throw Error(`Panel components must be rendered within a PanelGroup container`)
  }

  const onMouseDown = useCallback(
    (event: ReactMouseEvent) => {
      startDragging(id, event.nativeEvent)
    },
    [id, startDragging],
  )

  const onDrag = useCallback(
    (e: MouseEvent) => {
      drag(id, e)
    },
    [id, drag],
  )

  const onDragStop = useCallback(() => {
    el.current!.blur()
    stopDragging()
  }, [stopDragging])

  useEffect(() => {
    if (!isDragging || disabled) return

    // Set styles to prevent text selection and force an ew-resize cursor whilst
    // dragging. Return a reset callback so we can revert to any values that
    // might have been present before dragging started.
    function setDocumentStyles() {
      const bodyStyle = document.body.style
      const documentStyle = document.documentElement.style

      const {cursor} = documentStyle
      const {userSelect} = bodyStyle

      documentStyle.cursor = 'ew-resize'
      bodyStyle.userSelect = 'none'

      return () => {
        if (cursor) documentStyle.cursor = cursor
        else documentStyle.removeProperty('cursor')

        if (userSelect) bodyStyle.userSelect = userSelect
        else bodyStyle.removeProperty('user-select')
      }
    }

    const resetDocumentStyles = setDocumentStyles()
    window.addEventListener('mousemove', onDrag)
    window.addEventListener('mouseup', onDragStop)
    window.addEventListener('contextmenu', onDragStop)

    // eslint-disable-next-line consistent-return
    return () => {
      resetDocumentStyles()
      window.removeEventListener('mousemove', onDrag)
      window.removeEventListener('mouseup', onDragStop)
      window.removeEventListener('contextmenu', onDragStop)
    }
  }, [disabled, isDragging, onDrag, onDragStop])

  useLayoutEffect(() => {
    registerElement(id, {id, order, type: 'resizer', el})

    return () => {
      unregisterElement(id)
    }
  }, [id, order, registerElement, unregisterElement])

  return (
    <div className={resizer} onMouseDown={onMouseDown} ref={el}>
      <div className={disabled ? resizerInnerDisabled : resizerInner}>
        <span />
        <span />
      </div>
    </div>
  )
}
