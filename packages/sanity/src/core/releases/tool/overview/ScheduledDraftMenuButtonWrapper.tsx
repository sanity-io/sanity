import {type ReleaseDocument} from '@sanity/client'
import {EllipsisHorizontalIcon} from '@sanity/icons'
import {Menu, Spinner, useClickOutsideEvent} from '@sanity/ui'
import {useCallback, useMemo, useRef, useState} from 'react'

import {Button, Popover} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {useScheduledDraftDocument} from '../../hooks/useScheduledDraftDocument'
import {useScheduledDraftMenuActions} from '../../hooks/useScheduledDraftMenuActions'
import {type Mode} from './queryParamUtils'

export const ScheduledDraftMenuButtonWrapper = ({
  release,
  releaseGroupMode,
}: {
  release: ReleaseDocument
  releaseGroupMode: Mode
}) => {
  const {t} = useTranslation()
  const popoverRef = useRef<HTMLDivElement>(null)
  const scheduledDraftMenuRef = useRef<HTMLDivElement>(null)
  const [openPopover, setOpenPopover] = useState(false)

  const {firstDocument: scheduledDraftDocument} = useScheduledDraftDocument(release._id)

  const {menuItems, dialogs, isPerformingOperation} = useScheduledDraftMenuActions({
    release,
    disabled: !scheduledDraftDocument,
  })

  const displayedMenuItems = useMemo(() => {
    // When in archived mode, only show delete-schedule option
    if (releaseGroupMode === 'archived') {
      return [menuItems.deleteSchedule]
    }

    // When in active mode, show all options
    return [menuItems.publishNow, menuItems.editSchedule, menuItems.deleteSchedule]
  }, [releaseGroupMode, menuItems])

  const canPerformActions = Boolean(scheduledDraftDocument)

  const handleOnButtonClick = useCallback(() => {
    setOpenPopover((prev) => !prev)
  }, [])

  useClickOutsideEvent(
    () => setOpenPopover(false),
    () => [popoverRef.current, scheduledDraftMenuRef.current],
  )

  if (!canPerformActions) {
    return null
  }

  return (
    <>
      <Popover
        content={<Menu ref={scheduledDraftMenuRef}>{displayedMenuItems}</Menu>}
        open={openPopover}
        ref={popoverRef}
        constrainSize={false}
        fallbackPlacements={['top-end']}
        portal
        tone="default"
        placement="bottom"
      >
        <Button
          disabled={!canPerformActions || isPerformingOperation}
          icon={isPerformingOperation ? Spinner : EllipsisHorizontalIcon}
          mode="bleed"
          tooltipProps={{content: t('menu.tooltip')}}
          aria-label={t('menu.label')}
          data-testid="scheduled-draft-menu-button"
          onClick={handleOnButtonClick}
        />
      </Popover>
      {dialogs}
    </>
  )
}
