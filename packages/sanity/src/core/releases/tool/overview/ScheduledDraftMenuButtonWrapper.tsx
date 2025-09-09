import {type ReleaseDocument} from '@sanity/client'
import {CalendarIcon, EllipsisHorizontalIcon, PublishIcon, TrashIcon} from '@sanity/icons'
import {Menu, Spinner, useClickOutsideEvent, useToast} from '@sanity/ui'
import {useCallback, useMemo, useRef, useState} from 'react'

import {Button, MenuItem, Popover} from '../../../../ui-components'
import {useSchema} from '../../../hooks'
import {useTranslation} from '../../../i18n'
import {DeleteScheduledDraftDialog} from '../../components/dialog/DeleteScheduledDraftDialog'
import {PublishScheduledDraftDialog} from '../../components/dialog/PublishScheduledDraftDialog'
import {ScheduleDraftDialog} from '../../components/dialog/ScheduleDraftDialog'
import {useScheduleDraftOperationsWithToasts} from '../../hooks/useScheduleDraftOperationsWithToasts'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {isCardinalityOneRelease} from '../../util/util'
import {useBundleDocuments} from '../detail/useBundleDocuments'
import {type Mode} from './queryParamUtils'

type ScheduledDraftAction = 'publish-now' | 'delete-schedule' | 'edit-schedule'

interface ActionConfig {
  icon: React.ComponentType
  tone?: 'default' | 'critical'
  dialogHeaderI18nKey?: string
  dialogBodyI18nKey?: string
  dialogConfirmButtonI18nKey?: string
  confirmButtonTone?: 'primary' | 'critical'
}

const SCHEDULED_DRAFT_ACTION_MAP: Record<ScheduledDraftAction, ActionConfig> = {
  'publish-now': {
    icon: PublishIcon,
    dialogHeaderI18nKey: 'release.dialog.publish-scheduled-draft.header',
    dialogBodyI18nKey: 'release.dialog.publish-scheduled-draft.body',
    dialogConfirmButtonI18nKey: 'release.dialog.publish-scheduled-draft.confirm',
    confirmButtonTone: 'primary',
  },
  'delete-schedule': {
    icon: TrashIcon,
    tone: 'critical',
    // Uses shared DeleteScheduledDraftDialog component
  },
  'edit-schedule': {
    icon: CalendarIcon,
    // Uses custom dialog component
  },
}

export const ScheduledDraftMenuButtonWrapper = ({
  release,
  releaseGroupMode,
}: {
  release: ReleaseDocument
  releaseGroupMode: Mode
}) => {
  const {t} = useTranslation()
  const {t: tCore} = useTranslation()
  const toast = useToast()
  const schema = useSchema()

  const [isPerformingOperation, setIsPerformingOperation] = useState(false)
  const [selectedAction, setSelectedAction] = useState<ScheduledDraftAction | undefined>()
  const [openPopover, setOpenPopover] = useState(false)

  const popoverRef = useRef<HTMLDivElement | null>(null)
  const scheduledDraftMenuRef = useRef<HTMLDivElement | null>(null)

  const releaseId = getReleaseIdFromReleaseDocumentId(release._id)
  const {results: documents} = useBundleDocuments(releaseId)
  const firstDocument = documents?.[0]?.document
  const documentType = firstDocument?._type
  const schemaType = documentType ? schema.get(documentType) : null

  const scheduledDraftTitle =
    release.metadata.title || tCore('release.placeholder-untitled-release')

  const {publishScheduledDraft: runNow, rescheduleScheduledDraft: reschedule} =
    useScheduleDraftOperationsWithToasts(scheduledDraftTitle)

  const canPerformActions =
    release.state === 'scheduled' ||
    release.state === 'scheduling' ||
    (release.metadata.releaseType === 'scheduled' && isCardinalityOneRelease(release))

  const menuItems = useMemo(() => {
    const allItems = [
      {
        key: 'publish-now' as const,
        text: t('release.action.publish-now'),
        testId: 'publish-now-menu-item',
      },
      {
        key: 'edit-schedule' as const,
        text: t('release.action.edit-schedule'),
        testId: 'edit-schedule-menu-item',
      },
      {
        key: 'delete-schedule' as const,
        text: t('release.action.delete-schedule'),
        testId: 'delete-schedule-menu-item',
      },
    ]

    // When in archived mode, only show delete-schedule option
    if (releaseGroupMode === 'archived') {
      return allItems.filter((item) => item.key === 'delete-schedule')
    }

    // When in active mode, show all options
    return allItems
  }, [t, releaseGroupMode])

  const handleRunNow = useCallback(async () => {
    return runNow(release._id)
  }, [release._id, runNow])

  const handleReschedule = useCallback(
    async (newPublishAt: Date) => {
      setIsPerformingOperation(true)

      try {
        await reschedule(release._id, newPublishAt)
        setSelectedAction(undefined)
        setOpenPopover(false)
      } catch (error) {
        // Error toast handled by useScheduleDraftOperationsWithToasts
      } finally {
        setIsPerformingOperation(false)
      }
    },
    [release._id, reschedule],
  )

  const handleAction = useCallback(
    async (action: ScheduledDraftAction) => {
      // Special handling for delete-schedule and edit-schedule which have their own flows
      if (action === 'edit-schedule' || action === 'delete-schedule') return
      if (!canPerformActions) return

      if (action === 'publish-now') {
        setIsPerformingOperation(true)

        try {
          await handleRunNow()
          setSelectedAction(undefined)
          setOpenPopover(false)
        } catch (error) {
          console.error(`Failed to ${action} scheduled draft:`, error)
        } finally {
          setIsPerformingOperation(false)
          setSelectedAction(undefined)
        }
      }
    },
    [canPerformActions, handleRunNow],
  )

  const confirmActionDialog = useMemo(() => {
    if (!selectedAction) return null

    if (selectedAction === 'edit-schedule') {
      return (
        <ScheduleDraftDialog
          onClose={() => !isPerformingOperation && setSelectedAction(undefined)}
          onSchedule={handleReschedule}
          header={t('release.dialog.edit-schedule.header')}
          description={t('release.dialog.edit-schedule.body')}
          confirmButtonText={t('release.dialog.edit-schedule.confirm')}
          confirmButtonTone="primary"
          loading={isPerformingOperation}
          initialDate={release.publishAt}
        />
      )
    }

    if (selectedAction === 'delete-schedule') {
      return (
        <DeleteScheduledDraftDialog
          release={release}
          documentType={documentType}
          onClose={() => setSelectedAction(undefined)}
        />
      )
    }

    if (selectedAction === 'publish-now') {
      return (
        <PublishScheduledDraftDialog
          release={release}
          documentType={documentType}
          onClose={() => setSelectedAction(undefined)}
        />
      )
    }

    return null
  }, [selectedAction, isPerformingOperation, t, release, documentType, handleReschedule])

  const handleMenuItemClick = useCallback((action: ScheduledDraftAction) => {
    setSelectedAction(action)
    setOpenPopover(false)
  }, [])

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
        content={
          <Menu ref={scheduledDraftMenuRef}>
            {menuItems.map((item) => {
              const actionConfig = SCHEDULED_DRAFT_ACTION_MAP[item.key]
              return (
                <MenuItem
                  key={item.key}
                  onClick={() => handleMenuItemClick(item.key)}
                  disabled={isPerformingOperation}
                  icon={actionConfig.icon}
                  text={item.text}
                  tone={actionConfig.tone}
                  data-testid={item.testId}
                />
              )
            })}
          </Menu>
        }
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
      {confirmActionDialog}
    </>
  )
}
