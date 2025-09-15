import {type ReleaseDocument} from '@sanity/client'
import {Menu, MenuDivider} from '@sanity/ui'
import {memo} from 'react'

import {MenuItem} from '../../../../../ui-components'
import {useScheduledDraftMenuActions} from '../../../hooks/useScheduledDraftMenuActions'
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

  const isCopyToReleaseDisabled = disabled || !hasCreatePermission || isGoingToUnpublish

  const {actions, dialogs} = useScheduledDraftMenuActions({
    release,
    documentType: type,
    disabled,
    onEditSchedule: onChangeSchedule,
  })

  return (
    <>
      <Menu>
        <MenuItem {...actions.publishNow} />
        <MenuItem {...actions.editSchedule} />
        <MenuDivider />
        <CopyToReleaseMenuGroup
          releases={releases}
          fromRelease={fromRelease}
          onCreateRelease={onCreateRelease}
          onCreateVersion={onCreateVersion}
          disabled={isCopyToReleaseDisabled}
          hasCreatePermission={hasCreatePermission}
        />
        <MenuDivider />
        <MenuItem {...actions.deleteSchedule} />
      </Menu>

      {dialogs}
    </>
  )
})
