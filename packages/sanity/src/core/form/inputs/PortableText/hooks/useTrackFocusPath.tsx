import {
  PortableTextEditor,
  useEditor,
  usePortableTextEditor,
  usePortableTextEditorSelection,
} from '@portabletext/editor'
import {getFirstChild} from '@portabletext/editor/traversal'
import {type Path} from '@sanity/types'
import {isEqual} from '@sanity/util/paths'
import {useLayoutEffect, useRef} from 'react'
import scrollIntoView from 'scroll-into-view-if-needed'

import {pathToString} from '../../../../field'
import {usePortableTextMemberItemElementRefs} from '../contexts/PortableTextMemberItemElementRefsProvider'
import {classifyEditorPath, type EditorPathShape} from './classifyEditorPath'
import {useOpenPortableTextMember} from './useOpenPortableTextMember'

interface Props {
  focusPath: Path
  boundaryElement: HTMLElement | null
  onItemClose: () => void
}

interface EditorTarget {
  path: Path
  isTextBlock: boolean
}

/**
 * Drive the editor's scroll, selection, and focus from external
 * `focusPath` changes (e.g. Visual Editing clicks, deep links,
 * validation-jump, side-panel selection).
 *
 * Depth-agnostic — classifies the focus path through editor traversal
 * (`isBlock` / `isInline` / `getEnclosingBlock`) so the same logic
 * works for content at any container nesting depth. Bails when the
 * editor already owns DOM focus, or when an editing popover is open,
 * to avoid clobbering the user's in-progress editing.
 *
 * @internal
 */
export function useTrackFocusPath(props: Props): void {
  const {focusPath, boundaryElement, onItemClose} = props
  const editor = useEditor()
  const portableTextEditor = usePortableTextEditor()
  const selection = usePortableTextEditorSelection()
  const elementRefs = usePortableTextMemberItemElementRefs()
  const openEditingMember = useOpenPortableTextMember(
    (kind) => kind === 'annotation' || kind === 'objectBlock' || kind === 'inlineObject',
  )

  // Read selection from a ref to avoid re-firing the effect when our own
  // select() call below mutates it (#12894).
  const selectionRef = useRef(selection)
  useLayoutEffect(() => {
    selectionRef.current = selection
  }, [selection])

  useLayoutEffect(() => {
    if (focusPath.length === 0) {
      return
    }

    // When the editor owns DOM focus the user is editing inside it;
    // leave selection/scroll alone.
    const editorHasDomFocus =
      !!boundaryElement?.ownerDocument.activeElement &&
      boundaryElement.contains(boundaryElement.ownerDocument.activeElement)

    const currentSelection = selectionRef.current

    // Bail when the selection already matches the focus path AND the
    // editor still owns focus (either real DOM focus, or an open
    // editing popover whose focus has portaled outside the boundary).
    if (
      currentSelection?.focus.path &&
      isEqual(
        currentSelection.focus.path,
        focusPath.slice(0, currentSelection.focus.path.length),
      ) &&
      (editorHasDomFocus || Boolean(openEditingMember))
    ) {
      return
    }

    const snapshot = editor.getSnapshot()
    const intent = classifyEditorPath(snapshot, focusPath)
    if (intent.kind === 'unknown') {
      return
    }

    // The path we scroll to and look up an element ref against.
    const scrollTargetPath = intent.kind === 'annotation' ? intent.annotationPath : intent.blockPath
    const elementRef = elementRefs[pathToString(scrollTargetPath)]

    if (elementRef && boundaryElement) {
      scrollIntoView(boundaryElement, {
        scrollMode: 'if-needed',
        block: 'start',
        inline: 'start',
      })
      scrollIntoView(elementRef, {
        scrollMode: 'if-needed',
        boundary: boundaryElement,
        block: 'nearest',
        inline: 'start',
      })
    }

    // Compute the editor target: what to select, and whether to focus.
    const editorTarget = computeEditorTarget(snapshot, intent)
    if (!editorTarget) return

    const isTextBlockTarget = editorTarget.isTextBlock

    // Re-selecting the editor's current selection is a no-op (no event
    // fires, so no native focus or scroll) and the block can't be
    // re-entered (#12894). Deselect first to force a real change.
    const isSameSelection =
      currentSelection?.focus.path &&
      isEqual(currentSelection.focus.path.slice(0, editorTarget.path.length), editorTarget.path)
    if (isTextBlockTarget && isSameSelection) {
      PortableTextEditor.select(portableTextEditor, null)
    }

    PortableTextEditor.select(portableTextEditor, {
      anchor: {path: editorTarget.path, offset: 0},
      focus: {path: editorTarget.path, offset: 0},
    })

    // Object blocks open their interface when focused, so only call
    // focus for text-block targets.
    if (isTextBlockTarget) {
      PortableTextEditor.focus(portableTextEditor)
    }
  }, [
    boundaryElement,
    editor,
    portableTextEditor,
    elementRefs,
    focusPath,
    onItemClose,
    openEditingMember,
  ])
}

function computeEditorTarget(
  snapshot: ReturnType<ReturnType<typeof useEditor>['getSnapshot']>,
  intent: EditorPathShape,
): EditorTarget | undefined {
  if (intent.kind === 'spanText' || intent.kind === 'inlineChild') {
    return {path: intent.childPath, isTextBlock: true}
  }
  if (intent.kind === 'block') {
    // Resolve the block. If it's a text block, target its first child.
    // Otherwise (object block / container instance) target the block
    // path itself for selection purposes.
    const firstChild = getFirstChild(snapshot, intent.blockPath)
    if (firstChild) {
      return {path: firstChild.path, isTextBlock: true}
    }
    return {path: intent.blockPath, isTextBlock: false}
  }
  // Annotation / objectField targets don't drive editor selection
  // directly — scroll already happened above, and the modal handles
  // its own focus.
  return undefined
}
