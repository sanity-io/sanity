import {
  PortableTextEditor,
  useEditor,
  usePortableTextEditor,
  usePortableTextEditorSelection,
} from '@portabletext/editor'
import {getEnclosingBlock, getSpan} from '@portabletext/editor/traversal'
import {type Path} from '@sanity/types'
import {isEqual} from '@sanity/util/paths'
import {useLayoutEffect, useRef} from 'react'
import scrollIntoView from 'scroll-into-view-if-needed'

import {usePortableTextMemberItemElementRefs} from '../contexts/PortableTextMemberItemElementRefsProvider'
import {usePortableTextMemberItems} from './usePortableTextMembers'

interface Props {
  focusPath: Path
  ptInputPath: Path
  boundaryElement: HTMLElement | null
  onItemClose: () => void
}

// This hook will track the form focusPath and make sure editor content is visible (opened), scrolled to, and (potentially) focused accordingly.
export function useTrackFocusPath(props: Props): void {
  const {focusPath, ptInputPath, boundaryElement, onItemClose} = props

  const portableTextMemberItems = usePortableTextMemberItems()
  const elementRefs = usePortableTextMemberItemElementRefs()
  const editor = useEditor()
  const legacyEditor = usePortableTextEditor()
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

    // Resolve the enclosing block for focusPath from the editor snapshot.
    const snapshot = editor.getSnapshot()
    const enclosingBlock = getEnclosingBlock(snapshot, focusPath)
    const blockPath = enclosingBlock?.path
    const span = getSpan(snapshot, focusPath)

    // `blockPath` is editor-relative; member paths are doc-absolute. Compare
    // against the full absolute path so blocks that share `_key` across depth
    // don't collide (`_key` is unique per parent array, not globally).
    const enclosingBlockItem = blockPath
      ? portableTextMemberItems.find((m) =>
          isEqual(m.member.item.path, [...ptInputPath, ...blockPath]),
        )
      : undefined

    // The related editor member to scroll to, or focus, according to the given focusPath.
    // Prefer the path-resolved enclosing block: open/focused heuristics fall back to
    // ancestor containers at depth when nothing inside them is explicitly open.
    const relatedEditorItem = focusedItem || enclosingBlockItem || openItem
    const elementRef = relatedEditorItem ? elementRefs[relatedEditorItem.key] : undefined

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

      // Track focus and selection for focusPaths that are either inside text blocks,
      // or is pointing to the block itself (text and object blocks)
      if (isTextBlock || relatedEditorItem.kind === 'objectBlock') {
        let path: Path = []
        if (span) {
          // focusPath is on a span or descends into a primitive field on one. Use the span's path.
          path = span.path
        } else if (isTextBlock && blockPath && isEqual(focusPath, blockPath)) {
          // Known text block, but no child in the focusPath. Select first child.
          const children = enclosingBlock?.node.children
          if (Array.isArray(children) && children.length) {
            path = [...blockPath, 'children', {_key: children[0]._key}]
          }
        } else if (blockPath && isEqual(focusPath, blockPath)) {
          // Directly pointing to a non-text block
          path = blockPath
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
            PortableTextEditor.select(legacyEditor, null)
          }

          PortableTextEditor.select(legacyEditor, {
            anchor: {path, offset: 0},
            focus: {path, offset: 0},
          })
          // Object blocks open their interface when focused, so only call focus for text blocks.
          if (isTextBlock) {
            PortableTextEditor.focus(legacyEditor)
          }
        }
      }
    }
  }, [
    boundaryElement,
    editor,
    elementRefs,
    focusPath,
    legacyEditor,
    onItemClose,
    portableTextMemberItems,
    ptInputPath,
  ])
}
