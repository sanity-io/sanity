import {useEffect} from 'react'
import scrollIntoView from 'scroll-into-view-if-needed'
import {usePortableTextMemberItems} from './usePortableTextMembers'

interface Props {
  onCloseItem: () => void
  scrollElement: HTMLElement | null
}

// This hook will scroll to the "opened" portable text object's editor dom node.
export function useScrollToFocusFromOutside(props: Props): void {
  const {scrollElement, onCloseItem} = props
  const portableTextMemberItems = usePortableTextMemberItems()

  // This will scroll to the relevant block with focusPath pointing to an embedded object inside.
  useEffect(() => {
    const memberItem = portableTextMemberItems.find(
      (item) => item.member.open && item.member.collapsed === false
    )
    if (!memberItem) {
      return
    }
    if (memberItem?.elementRef?.current) {
      scrollIntoView(memberItem.elementRef?.current, {
        boundary: scrollElement,
        scrollMode: 'if-needed',
      })
      // Auto-close regular blocks
      if (memberItem.member.item.schemaType.name === 'block') {
        onCloseItem()
      }
    }
  }, [onCloseItem, portableTextMemberItems, scrollElement])
}
