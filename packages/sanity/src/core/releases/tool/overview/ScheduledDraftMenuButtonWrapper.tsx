import {type ReleaseDocument} from '@sanity/client'
import {EllipsisHorizontalIcon} from '@sanity/icons'
import {Menu, Spinner, useClickOutsideEvent} from '@sanity/ui'
import {useCallback, useMemo, useRef, useState} from 'react'

import {Button, MenuItem, Popover} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {useScheduledDraftDocument} from '../../../singleDocRelease/hooks/useScheduledDraftDocument'
import {useScheduledDraftMenuActions} from '../../../singleDocRelease/hooks/useScheduledDraftMenuActions'
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

  const {actions, dialogs, isPerformingOperation} = useScheduledDraftMenuActions({
    release,
    documentType: scheduledDraftDocument?._type,
    documentId: scheduledDraftDocument?._id,
    disabled: !scheduledDraftDocument,
  })

  const displayedMenuItems = useMemo(() => {
    // When in archived mode, only show delete-schedule option
    if (releaseGroupMode === 'archived') {
      return [<MenuItem key={'delete-schedule'} {...actions.deleteSchedule} />]
    }

    // When in active mode, show all options
    return [
      <MenuItem key={'publish-now'} {...actions.publishNow} />,
      <MenuItem key={'edit-schedule'} {...actions.editSchedule} />,
      <MenuItem key={'delete-schedule'} {...actions.deleteSchedule} />,
    ]
  }, [releaseGroupMode, actions])

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
          tooltipProps={{content: t('release.menu.tooltip')}}
          aria-label={t('release.menu.label')}
          data-testid="scheduled-draft-menu-button"
          onClick={handleOnButtonClick}
        />
      </Popover>
      {dialogs}
    </>
  )
}
