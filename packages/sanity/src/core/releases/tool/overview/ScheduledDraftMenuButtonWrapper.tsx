import {type ReleaseDocument} from '@sanity/client'
import {CloseCircleIcon, EllipsisHorizontalIcon} from '@sanity/icons'
import {Menu, Popover, Spinner, Text, useClickOutsideEvent} from '@sanity/ui'
import {useCallback, useRef, useState} from 'react'

import {Button, Dialog, MenuItem} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {releasesLocaleNamespace} from '../../i18n'
import {useReleaseOperations} from '../../store'

export const ScheduledDraftMenuButtonWrapper = ({release}: {release: ReleaseDocument}) => {
  const {t} = useTranslation(releasesLocaleNamespace)
  const {t: tCore} = useTranslation()
  const {unschedule} = useReleaseOperations()

  const [isPerformingOperation, setIsPerformingOperation] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [openPopover, setOpenPopover] = useState(false)

  const popoverRef = useRef<HTMLDivElement | null>(null)
  const scheduledDraftMenuRef = useRef<HTMLDivElement | null>(null)

  const scheduledDraftTitle =
    release.metadata.title || tCore('release.placeholder-untitled-release')
  const canUnschedule = release.state === 'scheduled' || release.state === 'scheduling'

  const handleUnschedule = useCallback(async () => {
    setIsPerformingOperation(true)
    try {
      await unschedule(release._id)
      setShowConfirmDialog(false)
      setOpenPopover(false)
    } catch (error) {
      console.error('Failed to unschedule scheduled draft:', error)
    } finally {
      setIsPerformingOperation(false)
    }
  }, [release._id, unschedule])

  const handleMenuItemClick = useCallback(() => {
    setShowConfirmDialog(true)
    setOpenPopover(false)
  }, [])

  const closePopover = useCallback(() => {
    setOpenPopover(false)
  }, [])

  const handleOnButtonClick = useCallback(() => {
    if (openPopover) {
      closePopover()
    } else {
      setOpenPopover(true)
    }
  }, [openPopover, closePopover])

  const handleCloseDialog = useCallback(() => {
    setShowConfirmDialog(false)
  }, [])

  useClickOutsideEvent(
    () => setOpenPopover(false),
    () => [popoverRef.current, scheduledDraftMenuRef.current],
  )

  if (!canUnschedule) {
    return null
  }

  const confirmDialog = showConfirmDialog && (
    <Dialog
      id="confirm-unschedule-scheduled-draft-dialog"
      header={t('action.unschedule-draft')}
      onClose={() => !isPerformingOperation && handleCloseDialog()}
      width={1}
      footer={{
        confirmButton: {
          text: t('action.unschedule-draft'),
          tone: 'critical',
          onClick: handleUnschedule,
          loading: isPerformingOperation,
          disabled: isPerformingOperation,
        },
        cancelButton: {
          disabled: isPerformingOperation,
        },
      }}
    >
      <Text>{t('dialog.unschedule-draft.body', {title: scheduledDraftTitle})}</Text>
    </Dialog>
  )

  return (
    <>
      <Popover
        content={
          <Menu ref={scheduledDraftMenuRef}>
            {canUnschedule && (
              <MenuItem
                key="unschedule"
                onClick={handleMenuItemClick}
                disabled={isPerformingOperation}
                icon={CloseCircleIcon}
                text={t('action.unschedule-draft')}
                data-testid="unschedule-scheduled-draft-menu-item"
              />
            )}
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
          disabled={!canUnschedule || isPerformingOperation}
          icon={isPerformingOperation ? Spinner : EllipsisHorizontalIcon}
          mode="bleed"
          tooltipProps={{content: t('menu.tooltip')}}
          aria-label={t('menu.label')}
          data-testid="scheduled-draft-menu-button"
          onClick={handleOnButtonClick}
        />
      </Popover>
      {confirmDialog}
    </>
  )
}
