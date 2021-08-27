import React, {ReactElement, FunctionComponent, useRef, useMemo} from 'react'
import {Element as SlateElement, Transforms, Editor} from 'slate'
import {ReactEditor, useEditor} from '@sanity/slate-react'
import {debugWithName} from '../utils/debug'
import {IS_DRAGGING, IS_DRAGGING_ELEMENT_RANGE, IS_DRAGGING_CHILD_ELEMENT} from '../utils/weakMaps'

const debug = debugWithName('components:DraggableChild')
const debugRenders = false

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
  spanType: string
  keyGenerator: () => string
}

export const DraggableChild: FunctionComponent<ElementProps> = ({
  children,
  element,
  readOnly,
  spanType,
  keyGenerator,
}) => {
  const editor = useEditor()
  const dragGhostRef: React.MutableRefObject<undefined | HTMLElement> = useRef()
  const isInline = useMemo(() => Editor.isInline(editor, element), [])
  const isVoid = useMemo(() => Editor.isVoid(editor, element), [])
  const isSpan = element._type === spanType

  if (debugRenders) {
    debug('render')
  }

  if (readOnly && !(isSpan || isInline)) {
    return <>{children}</>
  }

  // Note: this is called not for the dragging block, but for the targets when the block is dragged over them
  const handleDragOver = (event: any) => {
    const isMyDragOver = IS_DRAGGING_CHILD_ELEMENT.get(editor)
    if (!isMyDragOver) {
      return
    }
    debug('handle drag over')
    event.preventDefault() // Needed to get the dropEffect showing
    event.dataTransfer.dropEffect = 'move'

    let domRange
    const {document} = window
    const {clientX: x, clientY: y} = event

    // COMPAT: In Firefox, `caretRangeFromPoint` doesn't exist. (2020-05-14)
    if (document.caretRangeFromPoint) {
      domRange = document.caretRangeFromPoint(x, y)
    } else if (document.caretPositionFromPoint) {
      const position = document.caretPositionFromPoint(x, y)

      if (position) {
        domRange = document.createRange()
        domRange.setStart(position.offsetNode, position.offset)
        domRange.setEnd(position.offsetNode, position.offset)
      }
    }

    if (!domRange) {
      throw new Error(`Cannot resolve a Slate range from a DOM event: ${event}`)
    }

    // Resolve a Slate range from the DOM range.
    const range = ReactEditor.toSlateRange(editor, domRange)
    if (range) {
      IS_DRAGGING_ELEMENT_RANGE.set(editor, range)
      Transforms.select(editor, range)
    }
  }

  // Note: this is called for the dragging child
  const handleDragEnd = (event: any) => {
    IS_DRAGGING.set(editor, false)
    event.preventDefault()
    event.stopPropagation()
    if (dragGhostRef.current) {
      debug('Removing drag ghost')
      document.body.removeChild(dragGhostRef.current)
    }
    const range = IS_DRAGGING_ELEMENT_RANGE.get(editor)
    if (range && editor.selection) {
      debug('Removing and inserting')
      const dupedElement = {...element, _key: keyGenerator()}
      Transforms.insertNodes(editor, dupedElement, {at: range, select: true})
      Transforms.removeNodes(editor, {
        at: [],
        match: (n) => n._key === element._key,
        mode: 'lowest',
      })
      editor.onChange()
    }
    IS_DRAGGING_ELEMENT_RANGE.delete(editor)
    IS_DRAGGING_CHILD_ELEMENT.delete(editor)
  }

  // Note: this is called for the dragging child
  const handleDragStart = (event: any) => {
    debug('Drag start')
    if (!isVoid) {
      debug('Not dragging child')
      IS_DRAGGING.set(editor, false)
      return
    }
    event.dataTransfer.effectAllowed = 'move'

    IS_DRAGGING.set(editor, true)
    IS_DRAGGING_CHILD_ELEMENT.set(editor, element)
    // Specify dragImage so that single elements in the preview will not be the drag image,
    // but always the whole block preview itself.
    // Also clone it so that it will not be visually clipped by scroll-containers etc.
    const elm = event.currentTarget
    if (elm && elm instanceof HTMLElement) {
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

  if (isSpan) {
    return <span onDragOver={handleDragOver}>{children}</span>
  }

  const stopEventIfVoid = (event: any) => {
    if (isVoid) {
      event.stopPropagation()
      event.preventDefault()
    }
  }

  return (
    <span
      draggable={isVoid}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDrop={stopEventIfVoid}
    >
      {children}
    </span>
  )
}
