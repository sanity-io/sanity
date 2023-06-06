import {
  PortableTextEditor,
  usePortableTextEditor,
  usePortableTextEditorSelection,
} from '@sanity/portable-text-editor'
import {Path} from '@sanity/types'
import {useEffect} from 'react'
import scrollIntoView from 'scroll-into-view-if-needed'
import {isEqual} from '@sanity/util/paths'
import {usePortableTextMemberItems} from './usePortableTextMembers'

interface Props {
  focusPath: Path
  boundaryElement?: HTMLElement
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
      const isBlockFocusPath = focusPath.length === 1
      const isTextBlock = openItem.kind === 'textBlock'
      // Handle paths coming from the outside that are ending on `.text`
      // when pointing to span nodes. 'Click to edit' does this for instance.
      const isSpanTextFocusPath =
        isTextBlock &&
        focusPath.length === 4 &&
        focusPath[1] === 'children' &&
        focusPath[3] === 'text'
      // This is a normal span node path
      const isSpanFocusPath = isTextBlock && focusPath.length === 3 && focusPath[1] === 'children'

      // If the focusPath i targeting a text block (with focusPath on the block itself),
      // ensure that an editor selection is pointing to it's first child and then focus the editor.
      if (openItem.kind === 'textBlock') {
        const editorPath =
          isSpanFocusPath || isSpanTextFocusPath
            ? focusPath.slice(0, 3) // focusPath pointing to known span (slice so that the path doesn't include `.text`)
            : [
                focusPath[0],
                'children',
                (Array.isArray(openItem.node.value?.children) &&
                  openItem.node.value?.children[0]._key && {
                    _key: openItem.node.value?.children[0]._key,
                  }) ||
                  0,
              ] // unknown span (just a block key given as focusPath), select the first span

        // Make an editor selection if we have a child path, and not have focus inside of it
        if (isBlockFocusPath || isSpanFocusPath || isSpanTextFocusPath) {
          PortableTextEditor.select(editor, {
            anchor: {path: editorPath, offset: 0},
            focus: {path: editorPath, offset: 0},
          })
          PortableTextEditor.focus(editor)
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
