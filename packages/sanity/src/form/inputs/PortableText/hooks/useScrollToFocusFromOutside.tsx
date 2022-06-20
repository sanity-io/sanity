import {PortableTextEditor, usePortableTextEditor} from '@sanity/portable-text-editor'
import {Path} from '@sanity/types'
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

  // This will scroll to the relevant editor node which has a member that is opened.
  useEffect(() => {
    // Find the opened member that is most spesific (longest path).
    const memberItem = portableTextMemberItems
      .filter((item) => item.member.open)
      .sort((a, b) => b.member.item.path.length - a.member.item.path.length)[0]
    if (!memberItem) {
      return
    }
    if (memberItem?.elementRef?.current) {
      scrollIntoView(memberItem.elementRef?.current, {
        boundary: scrollElement,
        scrollMode: 'if-needed',
      })
      // Set selection in the editor if this is a block
      const relativePath = memberItem.member.item.path.slice(fieldPath.length)
      if (memberItem.kind === 'textBlock') {
        PortableTextEditor.select(editor, {
          anchor: {path: relativePath, offset: 0},
          focus: {path: relativePath, offset: 0},
        })
        PortableTextEditor.focus(editor)
        // Auto-close normal textBlock as there is no interface for doing so.
        onCloseItem()
      }
    }
  }, [editor, fieldPath.length, onCloseItem, portableTextMemberItems, scrollElement])
}
