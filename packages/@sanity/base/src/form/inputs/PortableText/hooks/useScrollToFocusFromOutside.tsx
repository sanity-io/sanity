import {usePortableTextEditor} from '@sanity/portable-text-editor'
import {Path} from '@sanity/types'
import {startsWith} from '@sanity/util/paths'
import {useEffect, useRef} from 'react'
import scrollIntoView from 'scroll-into-view-if-needed'
import {usePortableTextMemberItems} from './usePortableTextMembers'

interface Props {
  path: Path
  focusPath: Path
  scrollElement: HTMLElement | null
}

// This hook will scroll related editor item into view when the focusPath is pointing to a embedded object.
export function useScrollToFocusFromOutside(props: Props): void {
  const {focusPath, path, scrollElement} = props
  const targetPath = useRef<Path | null>(null)
  const editor = usePortableTextEditor()
  const portableTextMemberItems = usePortableTextMemberItems()

  // This will scroll to the relevant block with focusPath pointing to an embedded object inside.
  useEffect(() => {
    const memberItem = portableTextMemberItems.find((m) =>
      startsWith(m.member.item.path.slice(path.length), focusPath)
    )
    if (
      memberItem &&
      memberItem.member.collapsed === false &&
      memberItem.elementRef?.current &&
      focusPath.length > 0
    ) {
      targetPath.current = focusPath
      scrollIntoView(memberItem.elementRef?.current, {
        boundary: scrollElement,
        scrollMode: 'if-needed',
      })
    }
  }, [editor, focusPath, path.length, portableTextMemberItems, scrollElement])
}
