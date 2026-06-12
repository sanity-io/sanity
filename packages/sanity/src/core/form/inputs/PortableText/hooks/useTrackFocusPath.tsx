import {
  PortableTextEditor,
  usePortableTextEditor,
  usePortableTextEditorSelection,
} from '@portabletext/editor'
import {isKeyedObject, type KeyedObject, type Path} from '@sanity/types'
import {isEqual} from '@sanity/util/paths'
import {useLayoutEffect, useRef} from 'react'
import scrollIntoView from 'scroll-into-view-if-needed'

import {usePortableTextMemberItemElementRefs} from '../contexts/PortableTextMemberItemElementRefsProvider'
import {usePortableTextMemberItems} from './usePortableTextMembers'

interface Props {
  focusPath: Path
  boundaryElement: HTMLElement | null
  onItemClose: () => void
}

// This hook will track the form focusPath and make sure editor content is visible (opened), scrolled to, and (potentially) focused accordingly.
export function useTrackFocusPath(props: Props): void {
  const {focusPath, boundaryElement, onItemClose} = props

  const portableTextMemberItems = usePortableTextMemberItems()
  const elementRefs = usePortableTextMemberItemElementRefs()
  const editor = usePortableTextEditor()
  const selection = usePortableTextEditorSelection()

  // Read selection from a ref instead of subscribing to it, so our own select() calls below don't
  // re-fire the tracking effect into an infinite loop (#12894). Declared first to run before it.
  const selectionRef = useRef(selection)
  useLayoutEffect(() => {
    selectionRef.current = selection
  }, [selection])

  useLayoutEffect(() => {
    // Don't do anything if no focusPath to track
    if (focusPath.length === 0) {
      return
    }

    // When the editor holds DOM focus the user is editing inside it; leave its selection/scroll alone.
    const editorHasDomFocus =
      !!boundaryElement?.ownerDocument.activeElement &&
      boundaryElement.contains(boundaryElement.ownerDocument.activeElement)

    const currentSelection = selectionRef.current

    // The first open member of any kind, used below as the fallback target to scroll to / focus.
    const openItem = portableTextMemberItems.find((m) => m.member.open)

    // An open annotation/object/inline member has a popover mounted (focus portals outside the boundary).
    // Text blocks mount none and are excluded, so a re-click from outside still re-focuses them (#12894).
    const openEditingItem = portableTextMemberItems.find(
      (m) =>
        m.member.open &&
        (m.kind === 'annotation' || m.kind === 'objectBlock' || m.kind === 'inlineObject'),
    )

    // Bail only when the selection matches the focusPath AND the editor still owns focus (real DOM
    // focus, or an open editing popover). Focus from outside (Visual Editing) means neither (#12894).
    if (
      currentSelection?.focus.path &&
      isEqual(
        currentSelection.focus.path,
        focusPath.slice(0, currentSelection.focus.path.length),
      ) &&
      (editorHasDomFocus || Boolean(openEditingItem))
    ) {
      return
    }

    // Find the focused editor member item (if any)
    const focusedItem = portableTextMemberItems.find((m) => m.member.item.focused)

    // The related editor member to scroll to, or focus, according to the given focusPath
    const relatedEditorItem = focusedItem || openItem
    const elementRef = relatedEditorItem ? elementRefs[relatedEditorItem.member.key] : undefined

    if (relatedEditorItem && elementRef) {
      if (boundaryElement) {
        // Scroll the boundary element into view (the scrollable element itself)
        scrollIntoView(boundaryElement, {
          scrollMode: 'if-needed',
          block: 'start',
          inline: 'start',
        })
        // Scroll the member into view (the member within the scroll-boundary)
        scrollIntoView(elementRef, {
          scrollMode: 'if-needed',
          boundary: boundaryElement,
          block: 'nearest',
          inline: 'start',
        })
      }

      const isTextBlock = relatedEditorItem.kind === 'textBlock'
      const isBlockFocusPath = focusPath.length === 1

      // Track focus and selection for focusPaths that are either inside text blocks,
      // or is pointing to the block itself (text and object blocks)
      if (isTextBlock || isBlockFocusPath) {
        const textBlockChildKey =
          isTextBlock && isKeyedObject(focusPath[2]) ? focusPath[2]._key : undefined
        const child =
          textBlockChildKey && Array.isArray(relatedEditorItem.node.value?.children)
            ? (relatedEditorItem.node.value?.children.find((c) => c._key === textBlockChildKey) as
                | KeyedObject
                | undefined)
            : undefined

        // Is the focusPath pointing to span's `.text` property?
        const isSpanTextFocusPath =
          (child &&
            child._type === 'span' &&
            focusPath.length === 4 &&
            focusPath[1] === 'children' &&
            focusPath[3] === 'text') ||
          false

        // Is focus directly on a text block child?
        const isTextChildFocusPath =
          isTextBlock &&
          ((focusPath.length === 3 && focusPath[1] === 'children') || isSpanTextFocusPath)

        let path: Path = []
        // Known text block child
        if (isTextChildFocusPath) {
          path = focusPath.slice(0, 3)
        } else if (
          // Known text block, but unknown child. Select first child in that block.
          isTextBlock &&
          isBlockFocusPath &&
          Array.isArray(relatedEditorItem.node.value?.children)
        ) {
          path = [focusPath[0], 'children', {_key: relatedEditorItem.node.value?.children[0]._key}]
          // Directly pointing to a non-text block
        } else if (isBlockFocusPath) {
          path = [{_key: relatedEditorItem.key}]
        }

        // Select and focus the editor if we produced a path
        if (path.length) {
          // Re-selecting the editor's current selection is a no-op (no event fires, so no native
          // focus or scroll) and the block can't be re-entered (#12894). Deselect first to force a
          // real change. isSameSelection slices the selection to the target length: same block, any child.
          const isSameSelection =
            currentSelection?.focus.path &&
            isEqual(currentSelection.focus.path.slice(0, path.length), path)
          if (isTextBlock && isSameSelection) {
            PortableTextEditor.select(editor, null)
          }

          PortableTextEditor.select(editor, {
            anchor: {path, offset: 0},
            focus: {path, offset: 0},
          })
          // Object blocks open their interface when focused, so only call focus for text blocks.
          if (isTextBlock) {
            PortableTextEditor.focus(editor)
          }
        }
      }
    }
  }, [boundaryElement, editor, elementRefs, focusPath, onItemClose, portableTextMemberItems])
}
