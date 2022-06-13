import {
  PortableTextEditor,
  usePortableTextEditor,
  usePortableTextEditorSelection,
} from '@sanity/portable-text-editor'
import {Path} from '@sanity/types'
import {isEqual} from '@sanity/util/paths'
import {useEffect} from 'react'
import scrollIntoView from 'scroll-into-view-if-needed'
import {usePortableTextMemberItems} from './usePortableTextMembers'

interface Props {
  onCloseItem: () => void
  fieldPath: Path
  scrollElement: HTMLElement | null
}

// This hook will scroll to the "opened" portable text object's editor dom node.
export function useScrollToFocusFromOutside(props: Props): void {
  const {fieldPath, scrollElement, onCloseItem} = props
  const portableTextMemberItems = usePortableTextMemberItems()
  const editor = usePortableTextEditor()
  const selection = usePortableTextEditorSelection()

  // This will scroll to the relevant editor node which has a member that is opened.
  useEffect(() => {
    const memberItem = portableTextMemberItems.find((item) => item.member.open)
    if (!memberItem) {
      return
    }
    if (memberItem?.elementRef?.current) {
      scrollIntoView(memberItem.elementRef?.current, {
        boundary: scrollElement,
        scrollMode: 'if-needed',
      })
      const relativePath = memberItem.member.item.path.slice(fieldPath.length)
      // Only set selection and focus if it's not pointing to embedded data (annotations, objects etc)
      const setSelectionAndFocus =
        !PortableTextEditor.isObjectPath(editor, relativePath) &&
        (selection === null ||
          (selection.focus.path.length && !isEqual(relativePath, selection.focus.path)))
      if (setSelectionAndFocus) {
        PortableTextEditor.select(editor, {
          anchor: {path: relativePath, offset: 0},
          focus: {path: relativePath, offset: 0},
        })
        PortableTextEditor.focus(editor)
      }
      // Auto-close regular blocks
      if (memberItem.member.item.schemaType.name === 'block') {
        onCloseItem()
      }
    }
  }, [editor, selection, fieldPath.length, onCloseItem, portableTextMemberItems, scrollElement])
}
