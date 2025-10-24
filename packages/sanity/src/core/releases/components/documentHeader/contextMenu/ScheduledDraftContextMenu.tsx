import {type ReleaseDocument} from '@sanity/client'
import {CalendarIcon} from '@sanity/icons'
import {Menu, MenuDivider} from '@sanity/ui'
import {memo} from 'react'
import {IntentLink} from 'sanity/router'

import {MenuItem} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {useScheduledDraftMenuActions} from '../../../../singleDocRelease/hooks/useScheduledDraftMenuActions'
import {RELEASES_SCHEDULED_DRAFTS_INTENT} from '../../../../singleDocRelease/plugin'
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
        <IntentLink
          intent={RELEASES_SCHEDULED_DRAFTS_INTENT}
          params={{view: 'drafts'}}
          rel="noopener noreferrer"
          style={{textDecoration: 'none'}}
        >
          <MenuItem icon={CalendarIcon} text={t('release.action.view-scheduled-drafts')} />
        </IntentLink>
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
