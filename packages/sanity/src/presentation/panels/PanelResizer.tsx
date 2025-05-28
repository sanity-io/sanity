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
import {styled} from 'styled-components'

import {usePanelId} from './usePanelId'

const Resizer = styled.div`
  position: relative;
`
const ResizerInner = styled.div<{
  $disabled: boolean
}>`
  position: absolute;
  top: 0;
  bottom: 0;
  left: -5px;
  width: 9px;
  z-index: 10;
  cursor: ${({$disabled}) => ($disabled ? 'auto' : 'ew-resize')};

  /* Border */
  & > span:nth-child(1) {
    display: block;
    border-left: 1px solid var(--card-border-color);
    position: absolute;
    top: 0;
    left: 4px;
    bottom: 0;
    transition: opacity 200ms;
  }

  ${({$disabled}) =>
    !$disabled &&
    `
    /* Hover effect */
    & > span:nth-child(2) {
      display: block;
      position: absolute;
      top: 0;
      left: 0;
      width: 9px;
      bottom: 0;
      background-color: var(--card-border-color);
      opacity: 0;
      transition: opacity 150ms;
    }

    @media (hover: hover) {
      &:hover > span:nth-child(2) {
        opacity: 0.2;
      }
    }
  `}
`

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
    <Resizer onMouseDown={onMouseDown} ref={el}>
      <ResizerInner $disabled={disabled}>
        <span />
        <span />
      </ResizerInner>
    </Resizer>
  )
}
