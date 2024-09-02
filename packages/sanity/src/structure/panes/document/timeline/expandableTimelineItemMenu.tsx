import {Menu} from '@sanity/ui'
import {type MouseEvent, useCallback} from 'react'
import {ContextMenuButton, useTranslation} from 'sanity'

import {MenuButton, MenuItem} from '../../../../ui-components'
import {structureLocaleNamespace} from '../../../i18n'

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
  const handleExpandClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      // TODO: Avoid the click event to propagate to the parent button and closing the popover
      e.stopPropagation()
      onExpand()
    },
    [onExpand],
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
    />
  )
}
