import React, {ReactElement, useRef, useMemo, useCallback} from 'react'
import {Element as SlateElement, Transforms, Editor} from 'slate'
import {ReactEditor, useSlateStatic} from '@sanity/slate-react'
import {debugWithName} from '../utils/debug'
import {IS_DRAGGING, IS_DRAGGING_ELEMENT_RANGE, IS_DRAGGING_CHILD_ELEMENT} from '../utils/weakMaps'

const debug = debugWithName('components:DraggableChild')
declare global {
  interface Document {
    // TypeScript removed this function from the default types (2021-08-26)
    caretPositionFromPoint?(x: number, y: number): {offsetNode: Node; offset: number}
  }
}

type ElementProps = {
  children: ReactElement
  element: SlateElement
  readOnly: boolean
}

export const DraggableChild = ({children, element, readOnly}: ElementProps) => {
  const editor = useSlateStatic()
  const dragGhostRef: React.MutableRefObject<undefined | HTMLElement> = useRef()
  const isVoid = useMemo(() => Editor.isVoid(editor, element), [editor, element])

  // Note: this is called not for the dragging block, but for the targets when the block is dragged over them
  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      const isMyDragOver = IS_DRAGGING_CHILD_ELEMENT.get(editor)
      if (!isMyDragOver) {
        return
      }
      debug('handle drag over')
      event.preventDefault() // Needed to get the dropEffect showing
      event.dataTransfer.dropEffect = 'move'
      // Find the range where the drop happened
      const range = ReactEditor.findEventRange(editor, event)
      if (range) {
        IS_DRAGGING_ELEMENT_RANGE.set(editor, range)
        Transforms.select(editor, range)
      }
    },
    [editor]
  )

  // Note: this is called for the dragging child
  const handleDragStart = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      debug('Drag start')
      IS_DRAGGING.set(editor, true)
      IS_DRAGGING_CHILD_ELEMENT.set(editor, element)
      if (isVoid) {
        event.dataTransfer.effectAllowed = 'move'
        // Specify dragImage so that single elements in the preview will not be the drag image,
        // but always the whole block preview itself.
        // Also clone it so that it will not be visually clipped by scroll-containers etc.
        const elm = event.currentTarget
        if (elm instanceof HTMLElement) {
          const dragGhost = elm.cloneNode(true) as HTMLElement
          dragGhostRef.current = dragGhost
          dragGhost.style.width = `${elm.clientWidth}px`
          dragGhost.style.height = `${elm.clientHeight}px`
          dragGhost.style.position = 'absolute'
          dragGhost.style.top = '-99999px'
          dragGhost.style.left = '-99999px'
          if (document.body) {
            document.body.appendChild(dragGhost)
            const rect = elm.getBoundingClientRect()
            const x = event.clientX - rect.left
            const y = event.clientY - rect.top
            dragGhost.style.width = `${rect.width}px`
            dragGhost.style.height = `${rect.height}px`
            event.dataTransfer.setDragImage(dragGhost, x, y)
          }
        }
      }
    },
    [editor, element, isVoid]
  )

  if (readOnly) {
    return children
  }

  return (
    <span draggable={isVoid} onDragStart={handleDragStart} onDragOver={handleDragOver}>
      {children}
    </span>
  )
}
