import {
  PortableTextEditor,
  usePortableTextEditor,
  usePortableTextEditorSelection,
} from '@sanity/portable-text-editor'
import {Path, KeyedObject, isKeyedObject} from '@sanity/types'
import {useEffect} from 'react'
import scrollIntoView from 'scroll-into-view-if-needed'
import {isEqual} from '@sanity/util/paths'
import {usePortableTextMemberItems} from './usePortableTextMembers'

interface Props {
  focusPath: Path
  boundaryElement: HTMLElement | null
  onItemClose: () => void
}

// This hook will track the focusPath and make sure editor content is visible and focused accordingly.
export function useTrackFocusPath(props: Props): void {
  const {focusPath, boundaryElement, onItemClose} = props
  const portableTextMemberItems = usePortableTextMemberItems()
  const editor = usePortableTextEditor()
  const selection = usePortableTextEditorSelection()

  useEffect(() => {
    // Don't do anything if no focusPath
    if (focusPath.length === 0) {
      return
    }

    // Don't do anything if the selection focus path already is the focusPath
    if (selection?.focus.path && isEqual(selection.focus.path, focusPath)) {
      return
    }

    // Find the opened member item
    const openItem = portableTextMemberItems.find((m) => m.member.open)

    if (openItem && openItem.elementRef?.current) {
      if (boundaryElement) {
        // Scroll the boundary element into view (the scrollable element itself)
        scrollIntoView(boundaryElement, {
          scrollMode: 'if-needed',
          block: 'start',
          inline: 'start',
        })
        // Scroll the member into view (the member within the scroll-boundary)
        scrollIntoView(openItem.elementRef.current, {
          scrollMode: 'if-needed',
          boundary: boundaryElement,
          block: 'start',
          inline: 'start',
        })
      }
      const isTextBlock = openItem.kind === 'textBlock'
      const isBlockFocusPath = focusPath.length === 1

      // Track focus and selection for focusPaths that are either inside text blocks,
      // or is pointing to the block itself (text and object blocks)
      if (isTextBlock || isBlockFocusPath) {
        const textBlockChildKey =
          isTextBlock && isKeyedObject(focusPath[2]) ? focusPath[2]._key : undefined
        const child =
          textBlockChildKey && Array.isArray(openItem.node.value?.children)
            ? (openItem.node.value?.children.find((c) => c._key === textBlockChildKey) as
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
          Array.isArray(openItem.node.value?.children)
        ) {
          path = [focusPath[0], 'children', {_key: openItem.node.value?.children[0]._key}]
          // Directly pointing to a non-text block
        } else if (isBlockFocusPath) {
          path = [{_key: openItem.key}]
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
    focusPath,
    onItemClose,
    portableTextMemberItems,
    selection?.focus.path,
  ])
}
