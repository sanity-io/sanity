import {type ReleaseDocument} from '@sanity/client'
import {CalendarIcon, TrashIcon, UploadIcon} from '@sanity/icons'
import {Menu, MenuDivider, Spinner} from '@sanity/ui'
import {memo, useState} from 'react'

import {MenuItem} from '../../../../../ui-components/menuItem/MenuItem'
import {useTranslation} from '../../../../i18n'
import {DeleteScheduledDraftDialog} from '../../dialog/DeleteScheduledDraftDialog'
import {PublishScheduledDraftDialog} from '../../dialog/PublishScheduledDraftDialog'
import {CopyToReleaseMenuGroup} from './CopyToReleaseMenuGroup'

interface ScheduledDraftContextMenuProps {
  releases: ReleaseDocument[]
  fromRelease: string
  onCreateRelease: () => void
  onCreateVersion: (targetId: string) => void
  disabled?: boolean
  type: string
  isGoingToUnpublish?: boolean
  release: ReleaseDocument
  onChangeSchedule?: () => void
  hasCreatePermission: boolean | null
}

export const ScheduledDraftContextMenu = memo(function ScheduledDraftContextMenu(
  props: ScheduledDraftContextMenuProps,
) {
  const {
    releases,
    fromRelease,
    onCreateRelease,
    onCreateVersion,
    disabled,
    type,
    isGoingToUnpublish = false,
    release,
    onChangeSchedule,
    hasCreatePermission,
  } = props
  const {t} = useTranslation()

  const [isRunningNow, setIsRunningNow] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'publish-now' | 'delete-schedule' | null>(null)

  return (
    <>
      <Menu>
        <MenuItem
          icon={isRunningNow ? Spinner : UploadIcon}
          onClick={() => setConfirmAction('publish-now')}
          text={t('release.action.publish-now')}
          disabled={disabled || isRunningNow}
        />
        <MenuItem
          icon={CalendarIcon}
          text={t('release.action.edit-schedule')}
          disabled={disabled || isRunningNow}
          onClick={onChangeSchedule}
        />
        <MenuDivider />
        <CopyToReleaseMenuGroup
          releases={releases}
          fromRelease={fromRelease}
          onCreateRelease={onCreateRelease}
          onCreateVersion={onCreateVersion}
          disabled={disabled || !hasCreatePermission || isGoingToUnpublish || isRunningNow}
          hasCreatePermission={hasCreatePermission}
        />
        <MenuDivider />
        <MenuItem
          icon={TrashIcon}
          onClick={() => setConfirmAction('delete-schedule')}
          text={t('release.action.delete-schedule')}
          tone="critical"
          disabled={disabled || isRunningNow}
        />
      </Menu>

      {confirmAction === 'publish-now' && (
        <PublishScheduledDraftDialog
          release={release}
          documentType={type}
          onClose={() => setConfirmAction(null)}
        />
      )}

      {confirmAction === 'delete-schedule' && (
        <DeleteScheduledDraftDialog
          release={release}
          documentType={type}
          onClose={() => setConfirmAction(null)}
        />
      )}
    </>
  )
})
