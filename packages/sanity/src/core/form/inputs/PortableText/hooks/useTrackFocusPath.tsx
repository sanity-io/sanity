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

/**
 * Whether `element` can be brought fully into view: its height against the shortest of the
 * viewport and every ancestor that clips its content vertically — the same frames
 * `scrollIntoView` scrolls, so all of them have to be able to show it.
 */
function fitsInScrollport(element: HTMLElement): boolean {
  const {defaultView, documentElement} = element.ownerDocument
  let scrollportHeight = defaultView?.visualViewport?.height ?? documentElement.clientHeight

  for (let node = element.parentElement; node; node = node.parentElement) {
    // An ancestor that isn't overflowed shows all of its content whatever its overflow is, so
    // it constrains nothing.
    if (node.clientHeight >= node.scrollHeight) continue
    const overflowY = defaultView?.getComputedStyle(node).overflowY
    if (overflowY && overflowY !== 'visible' && overflowY !== 'clip') {
      scrollportHeight = Math.min(scrollportHeight, node.clientHeight)
    }
  }

  return element.getBoundingClientRect().height <= scrollportHeight
}

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
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const legacyEditor = usePortableTextEditor()
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const selection = usePortableTextEditorSelection()

  // Read selection from a ref instead of subscribing to it, so our own select() calls below don't
  // re-fire the tracking effect into an infinite loop (#12894). Declared first to run before it.
  const selectionRef = useRef(selection)
  useLayoutEffect(() => {
    selectionRef.current = selection
  }, [selection])

  // The focusPath value that has already been effectuated: either applied to the editor
  // (selected/focused below), or confirmed to match a selection the editor already owns.
  // The effect re-runs on member/element-ref churn so that a focusPath whose target hasn't
  // rendered yet can be retried, but a handled one must never be re-applied: unrelated re-runs
  // (e.g. validation markers arriving while the user types) would otherwise re-select at
  // offset 0 and hijack the caret to the start of the block (SAPP-4053). This matters whenever
  // the editor transiently loses DOM focus while the form focusPath stays put — such as a brief
  // readOnly flip toggling `contenteditable` off. Tracking by reference is safe because form
  // paths are interned (`pathFor`), so the value only changes when focus actually moves; the
  // ref is cleared whenever it does, keeping re-entry from outside (Visual Editing, #12894)
  // working when the same path is focused again later.
  const handledFocusPathRef = useRef<Path | null>(null)

  useLayoutEffect(() => {
    // Focus moved elsewhere (or was cleared on blur): forget the handled path so that focusing
    // the previous path again later is applied anew.
    if (handledFocusPathRef.current !== focusPath) {
      handledFocusPathRef.current = null
    }

    // Don't do anything if no focusPath to track
    if (focusPath.length === 0) {
      return
    }

    // This exact focusPath has already been effectuated; don't re-apply it on unrelated re-runs.
    if (handledFocusPathRef.current === focusPath) {
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
      handledFocusPathRef.current = focusPath
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
        // The boundary element is the editor's own scroll container. Aligning its top is what
        // brings the editor into view when focus arrives from outside it (a validation marker,
        // the Presentation tool), leaving the member scroll below to move the editor's own
        // scroll only. An editor styled to grow with its content (`height: auto`,
        // `overflow: visible`) is taller than the scroll container around it, so aligning its
        // top scrolls the member being revealed out of view instead — and the bounded member
        // scroll cannot correct that, as the editor no longer scrolls internally (SAPP-4475).
        // Reveal the member across every scrollable ancestor in that case.
        const revealEditor = fitsInScrollport(boundaryElement)

        if (revealEditor) {
          scrollIntoView(boundaryElement, {
            scrollMode: 'if-needed',
            block: 'start',
            inline: 'start',
          })
        }

        scrollIntoView(elementRef, {
          scrollMode: 'if-needed',
          boundary: revealEditor ? boundaryElement : null,
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
            // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
            PortableTextEditor.select(legacyEditor, null)
          }

          // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
          PortableTextEditor.select(legacyEditor, {
            anchor: {path, offset: 0},
            focus: {path, offset: 0},
          })
          // Object blocks open their interface when focused, so only call focus for text blocks.
          if (isTextBlock) {
            // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
            PortableTextEditor.focus(legacyEditor)
          }
          handledFocusPathRef.current = focusPath
        }
      }
    }
  }, [
    boundaryElement,
    editor,
    elementRefs,
    focusPath,
    legacyEditor,
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- pre-existing violation, to be fixed in a follow-up
    onItemClose,
    portableTextMemberItems,
    ptInputPath,
  ])
}
