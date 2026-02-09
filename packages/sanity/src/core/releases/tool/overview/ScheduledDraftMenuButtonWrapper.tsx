import {type ReleaseDocument} from '@sanity/client'
import {EllipsisHorizontalIcon} from '@sanity/icons'
import {Menu, Spinner, useClickOutsideEvent} from '@sanity/ui'
import {useCallback, useMemo, useRef, useState} from 'react'
import {useRouter} from 'sanity/router'

import {Button, MenuItem, Popover} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {useScheduledDraftDocument} from '../../../singleDocRelease/hooks/useScheduledDraftDocument'
import {useScheduledDraftMenuActions} from '../../../singleDocRelease/hooks/useScheduledDraftMenuActions'
import {getPublishedId} from '../../../util/draftUtils'
import {isPausedCardinalityOneRelease} from '../../../util/releaseUtils'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'

export const ScheduledDraftMenuButtonWrapper = ({release}: {release: ReleaseDocument}) => {
  const {t} = useTranslation()
  const router = useRouter()
  const popoverRef = useRef<HTMLDivElement>(null)
  const scheduledDraftMenuRef = useRef<HTMLDivElement>(null)
  const [openPopover, setOpenPopover] = useState(false)

  const {firstDocument: scheduledDraftDocument} = useScheduledDraftDocument(release._id)

  const handleActionComplete = useCallback(() => {
    if (!scheduledDraftDocument) return

    router.navigateIntent('edit', {
      id: getPublishedId(scheduledDraftDocument._id),
      type: scheduledDraftDocument._type,
      scheduledDraft: getReleaseIdFromReleaseDocumentId(release._id),
    })
  }, [router, scheduledDraftDocument, release._id])

  const {actions, dialogs, isPerformingOperation} = useScheduledDraftMenuActions({
    release,
    documentType: scheduledDraftDocument?._type,
    documentId: scheduledDraftDocument?._id,
    disabled: !scheduledDraftDocument,
    onActionComplete: handleActionComplete,
  })

  const displayedMenuItems = useMemo(() => {
    if (release.state === 'archived' || release.state === 'published') {
      return [<MenuItem key={'delete-schedule'} {...actions.deleteSchedule} />]
    }

    if (isPausedCardinalityOneRelease(release)) {
      return [
        <MenuItem key={'publish-now'} {...actions.publishNow} />,
        <MenuItem key={'schedule-publish'} {...actions.schedulePublish} />,
        <MenuItem key={'delete-schedule'} {...actions.deleteSchedule} />,
      ]
    }

    return [
      <MenuItem key={'publish-now'} {...actions.publishNow} />,
      <MenuItem key={'edit-schedule'} {...actions.editSchedule} />,
      <MenuItem key={'delete-schedule'} {...actions.deleteSchedule} />,
    ]
  }, [release, actions])

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
