import {PortableTextEditor, usePortableTextEditor} from '@sanity/portable-text-editor'
import {Path} from '@sanity/types'
import {useEffect} from 'react'
import scrollIntoView from 'scroll-into-view-if-needed'
import {usePortableTextMemberItems} from './usePortableTextMembers'

interface Props {
  focusPath: Path
  boundaryElement?: HTMLElement
  editorRootPath: Path
  onItemClose: () => void
}

// This hook will scroll to the "opened" portable text object's editor dom node.
// If the opened item is a regular text block, place the cursor there as well.
export function useScrollToOpenedMember(props: Props): void {
  const {focusPath, editorRootPath, boundaryElement, onItemClose} = props
  const portableTextMemberItems = usePortableTextMemberItems()
  const editor = usePortableTextEditor()

  useEffect(() => {
    // Don't do anything if there isn't focus
    if (focusPath.length === 0) {
      return
    }
    // Find the highest opened member item and scroll to it
    const memberItem = portableTextMemberItems
      .filter((item) => item.member.open)
      .sort((a, b) => b.member.item.path.length - a.member.item.path.length)[0]
    if (memberItem && memberItem.elementRef?.current && memberItem.member.open) {
      scrollIntoView(memberItem.elementRef.current, {
        boundary: boundaryElement,
        scrollMode: 'if-needed',
      })
      // If this is a text block (and not a child within), place the cursor in the beginning of it.
      const isChildPath = focusPath.slice(editorRootPath.length).length > 1
      if (memberItem.kind === 'textBlock' && !isChildPath) {
        const relativePath = memberItem.member.item.path.slice(editorRootPath.length).slice(0, 1)
        // "auto-close" regular text blocks or they get sticky here when trying to focus on an other field
        // There is no natural way of closing them (however opening something else would close them)
        PortableTextEditor.select(editor, {
          anchor: {path: relativePath, offset: 0},
          focus: {path: relativePath, offset: 0},
        })
        PortableTextEditor.focus(editor)
        onItemClose()
      }
    }
  }, [
    boundaryElement,
    editor,
    editorRootPath.length,
    focusPath,
    onItemClose,
    portableTextMemberItems,
  ])
}
