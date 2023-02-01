import React, {useState, useRef, useMemo, useCallback, DragEvent, useEffect} from 'react'
import {Element as SlateElement, Transforms, Path, Editor} from 'slate'
import {ReactEditor, useSlateStatic} from '@sanity/slate-react'
import {debugWithName} from '../../utils/debug'
import {
  IS_DRAGGING_ELEMENT_TARGET,
  IS_DRAGGING_BLOCK_ELEMENT,
  IS_DRAGGING,
  IS_DRAGGING_BLOCK_TARGET_POSITION,
} from '../../utils/weakMaps'

const debug = debugWithName('components:DraggableBlock')
const debugRenders = false

/**
 * @internal
 */
export interface DraggableBlockProps {
  children: React.ReactNode
  element: SlateElement
  readOnly: boolean
  blockRef: React.MutableRefObject<HTMLDivElement | null>
}

/**
 * Implements drag and drop functionality on editor block nodes
 * @internal
 */
export const DraggableBlock = ({children, element, readOnly, blockRef}: DraggableBlockProps) => {
  const editor = useSlateStatic()
  const dragGhostRef: React.MutableRefObject<undefined | HTMLElement> = useRef()
  const [isDragOver, setIsDragOver] = useState(false)
  const isVoid = useMemo(() => Editor.isVoid(editor, element), [editor, element])
  const isInline = useMemo(() => Editor.isInline(editor, element), [editor, element])

  const [blockElement, setBlockElement] = useState<HTMLElement | null>(null)

  useEffect(
    () => setBlockElement(blockRef ? blockRef.current : ReactEditor.toDOMNode(editor, element)),
    [editor, element, blockRef]
  )

  // Note: this is called not for the dragging block, but for the targets when the block is dragged over them
  const handleDragOver = useCallback(
    (event: DragEvent) => {
      const isMyDragOver = IS_DRAGGING_BLOCK_ELEMENT.get(editor)
      // debug('Drag over', blockElement)
      if (!isMyDragOver || !blockElement) {
        return
      }
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
      IS_DRAGGING_ELEMENT_TARGET.set(editor, element)
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
      setIsDragOver(true)
    },
    [blockElement, editor, element]
  )

  // Note: this is called not for the dragging block, but for the targets when the block is dragged over them
  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  // Note: this is called for the dragging block
  const handleDragEnd = useCallback(
    (event: DragEvent) => {
      const targetBlock = IS_DRAGGING_ELEMENT_TARGET.get(editor)
      if (targetBlock) {
        IS_DRAGGING.set(editor, false)
        event.preventDefault()
        event.stopPropagation()
        IS_DRAGGING_ELEMENT_TARGET.delete(editor)
        if (dragGhostRef.current) {
          debug('Removing drag ghost')
          document.body.removeChild(dragGhostRef.current)
        }
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

      const target = event.target

      if (target instanceof HTMLElement) {
        target.style.opacity = '1'
      }
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
      // Clone blockElement so that it will not be visually clipped by scroll-containers etc.
      // The application that uses the portable-text-editor may indicate the element used as
      // drag ghost by adding a truthy data attribute 'data-pt-drag-ghost-element' to a HTML element.
      if (blockElement && blockElement instanceof HTMLElement) {
        let dragGhost = blockElement.cloneNode(true) as HTMLElement
        const customGhost = dragGhost.querySelector('[data-pt-drag-ghost-element]')
        if (customGhost) {
          dragGhost = customGhost as HTMLElement
        }

        // Set the `data-dragged` attribute so the consumer can style the element while it’s dragged
        dragGhost.setAttribute('data-dragged', '')

        if (document.body) {
          dragGhostRef.current = dragGhost
          dragGhost.style.position = 'absolute'
          dragGhost.style.left = '-99999px'
          dragGhost.style.boxSizing = 'border-box'
          document.body.appendChild(dragGhost)
          const rect = blockElement.getBoundingClientRect()
          const x = event.clientX - rect.left
          const y = event.clientY - rect.top
          dragGhost.style.width = `${rect.width}px`
          dragGhost.style.height = `${rect.height}px`
          event.dataTransfer.setDragImage(dragGhost, x, y)
        }
      }
      handleDrag(event)
    },
    [blockElement, editor, handleDrag, isInline, isVoid]
  )

  const isDraggingOverFirstBlock =
    isDragOver && editor.children[0] === IS_DRAGGING_ELEMENT_TARGET.get(editor)
  const isDraggingOverLastBlock =
    isDragOver &&
    editor.children[editor.children.length - 1] === IS_DRAGGING_ELEMENT_TARGET.get(editor)
  const dragPosition = IS_DRAGGING_BLOCK_TARGET_POSITION.get(editor)

  const isDraggingOverTop =
    isDraggingOverFirstBlock ||
    (isDragOver && !isDraggingOverFirstBlock && !isDraggingOverLastBlock && dragPosition === 'top')
  const isDraggingOverBottom =
    isDraggingOverLastBlock ||
    (isDragOver &&
      !isDraggingOverFirstBlock &&
      !isDraggingOverLastBlock &&
      dragPosition === 'bottom')

  const dropIndicator = useMemo(
    () => (
      <div
        className="pt-drop-indicator"
        style={{
          position: 'absolute',
          width: '100%',
          height: 1,
          borderBottom: '1px solid currentColor',
          zIndex: 5,
        }}
      />
    ),
    []
  )

  if (readOnly) {
    return <>{children}</>
  }

  if (debugRenders) {
    debug('render')
  }

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
      {isDraggingOverTop && dropIndicator}
      {children}
      {isDraggingOverBottom && dropIndicator}
    </div>
  )
}
