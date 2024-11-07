import {ChevronLeftIcon} from '@sanity/icons'
import {type MouseEvent, useCallback} from 'react'
import {useTranslation} from 'sanity'
import {styled} from 'styled-components'

import {Button} from '../../../../ui-components'
import {structureLocaleNamespace} from '../../../i18n'
import {TIMELINE_LIST_WRAPPER_ID} from './timeline'

/**
 * This is a hack to force the scrollbar to not appear when the list is expanding,
 * if we don't do this the scrollbar will appear for a brief moment when the list is expanding and then disappear
 * when the list is fully expanded.
 */
function hideScrollbarOnExpand(isExpanded: boolean) {
  // Do nothing if the list is already expanded
  if (isExpanded) return

  const listWrapper = document.getElementById(TIMELINE_LIST_WRAPPER_ID)

  if (listWrapper) {
    const firstChildren = listWrapper.children[0] as HTMLElement
    const hasScrollbar = firstChildren.scrollHeight > firstChildren.clientHeight
    if (!hasScrollbar) {
      //
      const currentStyle = getComputedStyle(firstChildren).overflowY
      // Add overflow hidden to the listWrapper to avoid the scrollbar to appear when expanding
      firstChildren.style.overflowY = 'hidden'
      setTimeout(() => {
        // Reset the overflow style after the list is expanded
        firstChildren.style.overflowY = currentStyle
      }, 0)
    }
  }
}

const FlipIcon = styled(ChevronLeftIcon)`
  transition: transform 200ms;
  &[data-expanded='true'] {
    transform: rotate(-90deg);
  }
`

export function ExpandableTimelineItemButton({
  isExpanded,
  onExpand,
}: {
  isExpanded: boolean
  onExpand: () => void
}) {
  const {t} = useTranslation(structureLocaleNamespace)

  const handleExpandClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      hideScrollbarOnExpand(isExpanded)
      onExpand()
    },
    [onExpand, isExpanded],
  )

  return (
    <Button
      mode="bleed"
      icon={<FlipIcon data-expanded={isExpanded} />}
      tooltipProps={{
        content: isExpanded
          ? t('timeline-item.menu.action-collapse')
          : t('timeline-item.menu.action-expand'),
      }}
      onClick={handleExpandClick}
    />
  )
}
