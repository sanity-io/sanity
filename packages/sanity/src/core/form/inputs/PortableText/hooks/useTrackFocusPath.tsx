import {
  PortableTextEditor,
  usePortableTextEditor,
  usePortableTextEditorSelection,
} from '@portabletext/editor'
import {isKeyedObject, type KeyedObject, type Path} from '@sanity/types'
import {isEqual} from '@sanity/util/paths'
import {useLayoutEffect} from 'react'
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

  useLayoutEffect(() => {
    // Don't do anything if no focusPath to track
    if (focusPath.length === 0) {
      return
    }

    // Don't do anything if the editor selection focus path is already equal to the focusPath
    if (
      selection?.focus.path &&
      isEqual(selection.focus.path, focusPath.slice(0, selection.focus.path.length))
    ) {
      return
    }

    // Find the focused editor member item (if any)
    const focusedItem = portableTextMemberItems.find((m) => m.member.item.focused)

    // Find the opened member item (if any)
    const openItem = portableTextMemberItems.find((m) => m.member.open)

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
          PortableTextEditor.select(editor, {
            anchor: {path, offset: 0},
            focus: {path, offset: 0},
          })
          // Object blocks will have their interface opened when focused,
          // so only call focus for regular text blocks
          if (isTextBlock) {
            PortableTextEditor.focus(editor)
          }
        }
      }
    }
  }, [
    boundaryElement,
    editor,
    elementRefs,
    focusPath,
    onItemClose,
    portableTextMemberItems,
    selection?.focus.path,
  ])
}
