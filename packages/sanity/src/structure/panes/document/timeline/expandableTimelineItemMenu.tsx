import {Menu, usePortal} from '@sanity/ui'
import {type MouseEvent, useCallback} from 'react'
import {ContextMenuButton, useTranslation} from 'sanity'

import {MenuButton, MenuItem} from '../../../../ui-components'
import {structureLocaleNamespace} from '../../../i18n'
import {TIMELINE_LIST_WRAPPER_ID} from './timeline'
import {TIMELINE_MENU_PORTAL} from './timelineMenu'

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

export function ExpandableTimelineItemMenu({
  chunkId,
  isExpanded,
  onExpand,
}: {
  chunkId: string
  isExpanded: boolean
  onExpand: () => void
}) {
  const {t} = useTranslation(structureLocaleNamespace)
  const portalContext = usePortal()

  const handleExpandClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      e.stopPropagation()
      hideScrollbarOnExpand(isExpanded)
      onExpand()
    },
    [onExpand, isExpanded],
  )

  return (
    <MenuButton
      id={`timeline-item-menu-button-${chunkId}`}
      button={
        <ContextMenuButton
          aria-label={t('timeline-item.menu-button.aria-label')}
          size="large"
          tooltipProps={{content: t('timeline-item.menu-button.tooltip')}}
        />
      }
      menu={
        <Menu padding={1}>
          <MenuItem
            text={t(
              isExpanded
                ? 'timeline-item.menu.action-collapse'
                : 'timeline-item.menu.action-expand',
            )}
            onClick={handleExpandClick}
          />
        </Menu>
      }
      popover={{
        // when used inside the timeline menu we want to keep the element inside the popover, to avoid closing the popover when clicking expand.
        portal: portalContext.elements?.[TIMELINE_MENU_PORTAL] ? TIMELINE_MENU_PORTAL : true,
        placement: 'bottom-end',
        fallbackPlacements: ['left', 'left-end', 'left-start'],
      }}
    />
  )
}
