import {type ReleaseDocument} from '@sanity/client'
import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {Spinner, useClickOutsideEvent} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {useCallback, useMemo, useRef, useState} from 'react'
import {useRouter} from 'sanity/router'

import {Button} from '../../../../ui-components/button/Button'
import {MenuItem} from '../../../../ui-components/menuItem/MenuItem'
import {Popover} from '../../../../ui-components/popover/Popover'
import {
  getVersionContextMenuActionsContext,
  useConfiguredDocumentActionIds,
} from '../../../config/document/useConfiguredDocumentActionIds'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
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

  const configuredActionIds = useConfiguredDocumentActionIds(
    scheduledDraftDocument
      ? getVersionContextMenuActionsContext({
          schemaType: scheduledDraftDocument._type,
          documentGroupId: getPublishedId(scheduledDraftDocument._id),
          fromRelease: getReleaseIdFromReleaseDocumentId(release._id),
          isScheduledDraft: true,
        })
      : null,
  )
  const showPublishNow = configuredActionIds.has('publish')
  // Both EditScheduledDraftAction and useSchedulePublishAction claim the `schedule`
  // action id, so a config that removes only one of them still leaves this gate open.
  const showSchedule = configuredActionIds.has('schedule')
  const showDeleteSchedule = configuredActionIds.has('discardVersion')

  const displayedMenuItems = useMemo(() => {
    const deleteSchedule = showDeleteSchedule
      ? [<MenuItem key={'delete-schedule'} {...actions.deleteSchedule} />]
      : []

    if (release.state === 'archived' || release.state === 'published') {
      return deleteSchedule
    }

    const publishNow = showPublishNow
      ? [<MenuItem key={'publish-now'} {...actions.publishNow} />]
      : []

    if (isPausedCardinalityOneRelease(release)) {
      const schedulePublish = showSchedule
        ? [<MenuItem key={'schedule-publish'} {...actions.schedulePublish} />]
        : []

      return [...publishNow, ...schedulePublish, ...deleteSchedule]
    }

    const editSchedule = showSchedule
      ? [<MenuItem key={'edit-schedule'} {...actions.editSchedule} />]
      : []

    return [...publishNow, ...editSchedule, ...deleteSchedule]
  }, [release, actions, showPublishNow, showSchedule, showDeleteSchedule])

  const canPerformActions = Boolean(scheduledDraftDocument)
  const hasConfiguredMenuItems = displayedMenuItems.length > 0

  const handleOnButtonClick = useCallback(() => {
    setOpenPopover((prev) => !prev)
  }, [])

  useClickOutsideEvent(
    () => setOpenPopover(false),
    () => [popoverRef.current, scheduledDraftMenuRef.current],
  )

  if (!canPerformActions || !hasConfiguredMenuItems) {
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
