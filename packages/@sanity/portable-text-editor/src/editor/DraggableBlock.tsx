import React, {
  ReactElement,
  FunctionComponent,
  useState,
  useRef,
  useMemo,
  useCallback,
  DragEvent,
} from 'react'
import {Element as SlateElement, Transforms, Path, Editor} from 'slate'
import {ReactEditor, useEditor} from '@sanity/slate-react'
import {debugWithName} from '../utils/debug'
import {
  IS_DRAGGING_ELEMENT_TARGET,
  IS_DRAGGING_BLOCK_ELEMENT,
  IS_DRAGGING,
  IS_DRAGGING_BLOCK_TARGET_POSITION,
} from '../utils/weakMaps'
import {DraggableBlockWrapper} from './nodes'

const debug = debugWithName('components:DraggableBlock')
const debugRenders = false

type ElementProps = {
  children: ReactElement
  element: SlateElement
  readOnly: boolean
}

function useForceUpdate() {
  const [, setValue] = useState(0)
  // eslint-disable-next-line no-param-reassign
  return () => setValue((value) => ++value)
}

export const DraggableBlock: FunctionComponent<ElementProps> = ({children, element, readOnly}) => {
  const editor = useEditor()
  const dragGhostRef: React.MutableRefObject<undefined | HTMLElement> = useRef()
  const forceUpdate = useForceUpdate()
  const [isDragOver, setIsDragOver] = useState(false)
  const isVoid = useMemo(() => Editor.isVoid(editor, element), [editor, element])
  const isInline = useMemo(() => Editor.isInline(editor, element), [editor, element])

  // Note: this is called not for the dragging block, but for the targets when the block is dragged over them
  const handleDragOver = useCallback(
    (event: DragEvent) => {
      const isMyDragOver = IS_DRAGGING_BLOCK_ELEMENT.get(editor)
      // debug('Drag over', isMyDragOver)
      if (!isMyDragOver) {
        return
      }
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
      IS_DRAGGING_ELEMENT_TARGET.set(editor, element)
      const blockElement = ReactEditor.toDOMNode(editor, element)
      const elementRect = blockElement.getBoundingClientRect()
      const offset = elementRect.top
      const height = elementRect.height
      const Y = event.pageY
      const loc = Math.abs(offset - Y)
      let position: 'top' | 'bottom' = 'bottom'
      if (element === editor.children[0]) {
        position = 'top'
      } else if (loc < height / 2) {
        position = 'top'
        IS_DRAGGING_BLOCK_TARGET_POSITION.set(editor, position)
      } else {
        position = 'bottom'
        IS_DRAGGING_BLOCK_TARGET_POSITION.set(editor, position)
      }
      if (isMyDragOver === element) {
        event.dataTransfer.dropEffect = 'none'
        return
      }
      forceUpdate()
      setIsDragOver(true)
    },
    [editor, element, forceUpdate]
  )

  // Note: this is called not for the dragging block, but for the targets when the block is dragged over them
  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  // Note: this is called for the dragging block
  const handleDragEnd = useCallback(
    (event: DragEvent) => {
      IS_DRAGGING.set(editor, false)
      event.preventDefault()
      event.stopPropagation()
      const targetBlock = IS_DRAGGING_ELEMENT_TARGET.get(editor)
      IS_DRAGGING_ELEMENT_TARGET.delete(editor)
      if (dragGhostRef.current) {
        debug('Removing drag ghost')
        document.body.removeChild(dragGhostRef.current)
      }
      if (targetBlock) {
        const dragPosition = IS_DRAGGING_BLOCK_TARGET_POSITION.get(editor)
        IS_DRAGGING_BLOCK_TARGET_POSITION.delete(editor)
        let targetPath = ReactEditor.findPath(editor, targetBlock)
        const myPath = ReactEditor.findPath(editor, element)
        const isBefore = Path.isBefore(myPath, targetPath)
        if (dragPosition === 'bottom' && !isBefore) {
          // If it is already at the bottom, don't do anything.
          if (targetPath[0] >= editor.children.length - 1) {
            debug('target is already at the bottom, not moving')
            return
          }
          const originalPath = targetPath
          targetPath = Path.next(targetPath)
          debug(
            `Adjusting targetPath from ${JSON.stringify(originalPath)} to ${JSON.stringify(
              targetPath
            )}`
          )
        }
        if (dragPosition === 'top' && isBefore && targetPath[0] !== editor.children.length - 1) {
          const originalPath = targetPath
          targetPath = Path.previous(targetPath)
          debug(
            `Adjusting targetPath from ${JSON.stringify(originalPath)} to ${JSON.stringify(
              targetPath
            )}`
          )
        }
        if (Path.equals(targetPath, myPath)) {
          event.preventDefault()
          debug('targetPath and myPath is the same, not moving')
          return
        }
        debug(
          `Moving element ${element._key} from path ${JSON.stringify(myPath)} to ${JSON.stringify(
            targetPath
          )} (${dragPosition})`
        )
        Transforms.moveNodes(editor, {at: myPath, to: targetPath})
        editor.onChange()
        return
      }
      debug('No target element, not doing anything')
    },
    [editor, element]
  )
  // Note: this is called not for the dragging block, but for the drop target
  const handleDrop = useCallback(
    (event: DragEvent) => {
      if (IS_DRAGGING_BLOCK_ELEMENT.get(editor)) {
        debug('On drop (prevented)', element)
        event.preventDefault()
        event.stopPropagation()
        setIsDragOver(false)
      }
    },
    [editor, element]
  )
  // Note: this is called for the dragging block
  const handleDrag = useCallback(
    (event: DragEvent) => {
      if (!isVoid) {
        IS_DRAGGING_BLOCK_ELEMENT.delete(editor)
        return
      }
      IS_DRAGGING.set(editor, true)
      IS_DRAGGING_BLOCK_ELEMENT.set(editor, element)
      event.stopPropagation() // Stop propagation so that leafs don't get this and take focus/selection!
    },
    [editor, element, isVoid]
  )

  // Note: this is called for the dragging block
  const handleDragStart = useCallback(
    (event: DragEvent) => {
      if (!isVoid || isInline) {
        debug('Not dragging block')
        IS_DRAGGING_BLOCK_ELEMENT.delete(editor)
        IS_DRAGGING.set(editor, false)
        return
      }
      debug('Drag start')
      IS_DRAGGING.set(editor, true)
      if (event.dataTransfer) {
        event.dataTransfer.setData('application/portable-text', 'something')
        event.dataTransfer.effectAllowed = 'move'
      }
      // Specify dragImage so that single elements in the preview will not be the drag image,
      // but always the whole block preview itself.
      // Also clone it so that it will not be visually clipped by scroll-containers etc.
      const _element = event.currentTarget
      if (_element && _element instanceof HTMLElement) {
        const dragGhost = _element.cloneNode(true) as HTMLElement
        dragGhostRef.current = dragGhost
        dragGhost.style.width = `${element.clientWidth}px`
        dragGhost.style.height = `${element.clientHeight}px`
        dragGhost.style.position = 'absolute'
        dragGhost.style.top = '-99999px'
        dragGhost.style.left = '-99999px'
        if (document.body) {
          document.body.appendChild(dragGhost)
          const rect = _element.getBoundingClientRect()
          const x = event.clientX - rect.left
          const y = event.clientY - rect.top
          dragGhost.style.width = `${rect.width}px`
          dragGhost.style.height = `${rect.height}px`
          event.dataTransfer.setDragImage(dragGhost, x, y)
        }
      }
      handleDrag(event)
    },
    [editor, element.clientHeight, element.clientWidth, handleDrag, isInline, isVoid]
  )
  if (readOnly) {
    return <>{children}</>
  }

  if (debugRenders) {
    debug('render')
  }
  const isDraggingOverFirstBlock =
    isDragOver && editor.children[0] === IS_DRAGGING_ELEMENT_TARGET.get(editor)
  const isDraggingOverLastBlock =
    isDragOver &&
    editor.children[editor.children.length - 1] === IS_DRAGGING_ELEMENT_TARGET.get(editor)
  const dragPosition = IS_DRAGGING_BLOCK_TARGET_POSITION.get(editor)
  return (
    <div
      draggable={isVoid}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDragEnd={handleDragEnd}
      onDrop={handleDrop}
    >
      <DraggableBlockWrapper
        isDraggingOverTop={
          isDraggingOverFirstBlock ||
          (isDragOver &&
            !isDraggingOverFirstBlock &&
            !isDraggingOverLastBlock &&
            dragPosition === 'top')
        }
        isDraggingOverBottom={
          isDraggingOverLastBlock ||
          (isDragOver &&
            !isDraggingOverFirstBlock &&
            !isDraggingOverLastBlock &&
            dragPosition === 'bottom')
        }
      >
        {children}
      </DraggableBlockWrapper>
    </div>
  )
}
