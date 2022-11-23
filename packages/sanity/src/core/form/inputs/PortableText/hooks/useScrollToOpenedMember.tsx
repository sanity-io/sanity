import {PortableTextEditor, usePortableTextEditor} from '@sanity/portable-text-editor'
import {Path} from '@sanity/types'
import {useEffect, useMemo} from 'react'
import scrollIntoView from 'scroll-into-view-if-needed'
import {usePortableTextMemberItems} from './usePortableTextMembers'

interface Props {
  editorRootPath: Path
  hasFormFocus: boolean // Wether we have focus on something in the editor's form state
  scrollElement: HTMLElement | null
  onItemClose: () => void
}

// This hook will scroll to the "opened" portable text object's editor dom node.
// If the opened item is a regular text block, place the cursor there as well.
export function useScrollToOpenedMember(props: Props): void {
  const {editorRootPath, scrollElement, hasFormFocus, onItemClose} = props
  const portableTextMemberItems = usePortableTextMemberItems()
  const editor = usePortableTextEditor()

  // Find the opened item with the highest path
  const memberItem = useMemo(() => {
    return portableTextMemberItems
      .filter((item) => item.member.open)
      .sort((a, b) => b.member.item.path.length - a.member.item.path.length)[0]
  }, [portableTextMemberItems])

  useEffect(() => {
    // If the editor already has form focus, don't interfere.
    if (hasFormFocus) {
      return
    }
    if (memberItem?.elementRef?.current) {
      scrollIntoView(memberItem.elementRef?.current, {
        boundary: scrollElement,
        scrollMode: 'if-needed',
      })
      // If this is a text block, place the cursor in the beginning of it.
      if (memberItem.kind === 'textBlock') {
        const relativePath = memberItem.member.item.path.slice(editorRootPath.length)
        PortableTextEditor.select(editor, {
          anchor: {path: relativePath, offset: 0},
          focus: {path: relativePath, offset: 0},
        })
        PortableTextEditor.focus(editor)
        // "auto-close" regular text blocks or they get sticky here when trying to focus on an other field
        // There is no natural way of closing them (however opening something else would close them)
        onItemClose()
      }
    }
  }, [editor, hasFormFocus, editorRootPath.length, memberItem, scrollElement, onItemClose])
}
