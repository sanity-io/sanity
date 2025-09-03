import {type ReleaseDocument} from '@sanity/client'
import {ClockIcon, EllipsisHorizontalIcon, PlayIcon, TrashIcon} from '@sanity/icons'
import {Menu, Spinner, Text, useClickOutsideEvent, useToast} from '@sanity/ui'
import {type ReactNode, useCallback, useMemo, useRef, useState} from 'react'

import {Button, Dialog, MenuItem, Popover} from '../../../../ui-components'
import {Translate, useTranslation} from '../../../i18n'
import {ScheduleDraftDialog} from '../../components/dialog/ScheduleDraftDialog'
import {useScheduleDraftOperationsWithToasts} from '../../hooks/useScheduleDraftOperationsWithToasts'
import {releasesLocaleNamespace} from '../../i18n'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {useBundleDocuments} from '../detail/useBundleDocuments'

type ScheduledDraftAction = 'run-now' | 'delete-schedule' | 'change-schedule'

interface ActionConfig {
  icon: React.ComponentType
  tone?: 'default' | 'critical'
  dialogHeaderI18nKey?: string
  dialogBodyI18nKey?: string
  dialogConfirmButtonI18nKey?: string
  confirmButtonTone?: 'primary' | 'critical'
}

const SCHEDULED_DRAFT_ACTION_MAP: Record<ScheduledDraftAction, ActionConfig> = {
  'run-now': {
    icon: PlayIcon,
    dialogHeaderI18nKey: 'dialog.run-now.header',
    dialogBodyI18nKey: 'dialog.run-now.body',
    dialogConfirmButtonI18nKey: 'dialog.run-now.confirm',
    confirmButtonTone: 'primary',
  },
  'delete-schedule': {
    icon: TrashIcon,
    tone: 'critical',
    dialogHeaderI18nKey: 'dialog.delete-schedule.header',
    dialogBodyI18nKey: 'dialog.delete-schedule.body',
    dialogConfirmButtonI18nKey: 'dialog.delete-schedule.confirm',
    confirmButtonTone: 'critical',
  },
  'change-schedule': {
    icon: ClockIcon,
    // Uses custom dialog component
  },
}

export const ScheduledDraftMenuButtonWrapper = ({release}: {release: ReleaseDocument}) => {
  const {t} = useTranslation(releasesLocaleNamespace)
  const {t: tCore} = useTranslation()
  const toast = useToast()

  const [isPerformingOperation, setIsPerformingOperation] = useState(false)
  const [selectedAction, setSelectedAction] = useState<ScheduledDraftAction | undefined>()
  const [openPopover, setOpenPopover] = useState(false)

  const popoverRef = useRef<HTMLDivElement | null>(null)
  const scheduledDraftMenuRef = useRef<HTMLDivElement | null>(null)

  // Get the documents in this release to show the document title
  const releaseId = getReleaseIdFromReleaseDocumentId(release._id)
  const {results: documents} = useBundleDocuments(releaseId)
  const firstDocument = documents?.[0]?.document

  const scheduledDraftTitle =
    release.metadata.title || tCore('release.placeholder-untitled-release')

  const {runNow, deleteSchedule, reschedule} =
    useScheduleDraftOperationsWithToasts(scheduledDraftTitle)

  // For scheduled drafts, check if it's actually scheduled based on state or metadata
  const canPerformActions =
    release.state === 'scheduled' ||
    release.state === 'scheduling' ||
    (release.metadata.releaseType === 'scheduled' && release.metadata.cardinality === 'one')

  const menuItems = useMemo(
    () => [
      {
        key: 'run-now' as const,
        text: t('action.run-now'),
        testId: 'run-now-menu-item',
      },
      {
        key: 'change-schedule' as const,
        text: t('action.change-schedule'),
        testId: 'change-schedule-menu-item',
      },
      {
        key: 'delete-schedule' as const,
        text: t('action.delete-schedule'),
        testId: 'delete-schedule-menu-item',
      },
    ],
    [t],
  )

  // Individual action handlers using toast-enabled hook methods
  const handleRunNow = useCallback(async () => {
    return runNow(release._id)
  }, [release._id, runNow])

  const handleDeleteSchedule = useCallback(async () => {
    return deleteSchedule(release._id)
  }, [release._id, deleteSchedule])

  const handleReschedule = useCallback(
    async (newPublishAt: Date) => {
      setIsPerformingOperation(true)

      try {
        await reschedule(release._id, newPublishAt)
        setSelectedAction(undefined)
        setOpenPopover(false)
      } catch (error) {
        // Error toast already handled by handleScheduledDraftOperation
      } finally {
        setIsPerformingOperation(false)
      }
    },
    [release._id, reschedule],
  )

  const handleAction = useCallback(
    async (action: ScheduledDraftAction) => {
      // Special handling for change-schedule which has its own flow
      if (action === 'change-schedule') return
      if (!canPerformActions) return

      const actionLookup = {
        'run-now': handleRunNow,
        'delete-schedule': handleDeleteSchedule,
      }

      setIsPerformingOperation(true)

      try {
        await actionLookup[action as 'run-now' | 'delete-schedule']()
        setSelectedAction(undefined)
        setOpenPopover(false)
      } catch (error) {
        console.error(`Failed to ${action} scheduled draft:`, error)
      } finally {
        setIsPerformingOperation(false)
        setSelectedAction(undefined)
      }
    },
    [canPerformActions, handleRunNow, handleDeleteSchedule],
  )

  // Render confirmation dialog based on selected action
  const confirmActionDialog = useMemo(() => {
    if (!selectedAction) return null

    // Special handling for change-schedule which uses a custom dialog
    if (selectedAction === 'change-schedule') {
      return (
        <ScheduleDraftDialog
          onClose={() => !isPerformingOperation && setSelectedAction(undefined)}
          onSchedule={handleReschedule}
          header={t('dialog.change-schedule.header')}
          description={t('dialog.change-schedule.body')}
          confirmButtonText={t('dialog.change-schedule.confirm')}
          confirmButtonTone="primary"
          loading={isPerformingOperation}
          initialDate={release.publishAt}
        />
      )
    }

    const actionConfig = SCHEDULED_DRAFT_ACTION_MAP[selectedAction]
    if (!actionConfig.dialogHeaderI18nKey) return null

    // Get document title for better confirmation messages
    const documentTitle = firstDocument?.title || firstDocument?.name || 'this document'

    // Custom confirmation messages based on action using translation keys
    let confirmationMessage: ReactNode
    if (selectedAction === 'run-now') {
      confirmationMessage = (
        <Translate
          t={tCore}
          i18nKey="release.dialog.run-now.confirm-message"
          values={{title: String(documentTitle)}}
          components={{
            Strong: ({children}: {children?: ReactNode}) => <strong>{children}</strong>,
          }}
        />
      )
    } else if (selectedAction === 'delete-schedule') {
      confirmationMessage = (
        <Translate
          t={tCore}
          i18nKey="release.dialog.delete-schedule.confirm-message"
          values={{title: String(documentTitle)}}
          components={{
            Strong: ({children}: {children?: ReactNode}) => <strong>{children}</strong>,
          }}
        />
      )
    } else {
      confirmationMessage = t(actionConfig.dialogBodyI18nKey!, {title: scheduledDraftTitle})
    }

    return (
      <Dialog
        id={`confirm-${selectedAction}-dialog`}
        data-testid={`confirm-${selectedAction}-dialog`}
        header={t(actionConfig.dialogHeaderI18nKey)}
        onClose={() => !isPerformingOperation && setSelectedAction(undefined)}
        width={1}
        footer={{
          confirmButton: {
            text: t(actionConfig.dialogConfirmButtonI18nKey!),
            tone: actionConfig.confirmButtonTone,
            onClick: () => handleAction(selectedAction),
            loading: isPerformingOperation,
            disabled: isPerformingOperation,
          },
          cancelButton: {
            disabled: isPerformingOperation,
          },
        }}
      >
        <Text>{confirmationMessage}</Text>
      </Dialog>
    )
  }, [
    selectedAction,
    isPerformingOperation,
    t,
    tCore,
    scheduledDraftTitle,
    release.publishAt,
    handleAction,
    handleReschedule,
    firstDocument,
  ])

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
