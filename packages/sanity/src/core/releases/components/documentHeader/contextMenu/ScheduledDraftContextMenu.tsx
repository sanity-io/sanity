import {type ReleaseDocument} from '@sanity/client'
import {CalendarIcon} from '@sanity/icons'
import {Menu, MenuDivider} from '@sanity/ui'
import {memo} from 'react'
import {IntentLink} from 'sanity/router'

import {MenuItem} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {type UseScheduledDraftMenuActionsReturn} from '../../../../singleDocRelease/hooks/useScheduledDraftMenuActions'
import {RELEASES_SCHEDULED_DRAFTS_INTENT} from '../../../../singleDocRelease/plugin'
import {useWorkspace} from '../../../../studio'
import {isPausedCardinalityOneRelease} from '../../../../util/releaseUtils'
import {isReleaseScheduledOrScheduling} from '../../../util/util'
import {useHasCopyToDraftOption} from './CopyToDraftsMenuItem'
import {CopyToReleaseMenuGroup} from './CopyToReleaseMenuGroup'

interface ScheduledDraftContextMenuProps {
  releases: ReleaseDocument[]
  bundleId: string
  onCreateRelease: () => void
  onCopyToDrafts: () => void
  onCopyToDraftsNavigate: () => void
  onCreateVersion: (targetId: string) => void
  disabled?: boolean
  isGoingToUnpublish?: boolean
  hasCreatePermission: boolean | null
  scheduledDraftMenuActions: UseScheduledDraftMenuActionsReturn
  documentId: string
  documentType: string
  release?: ReleaseDocument
}

export const ScheduledDraftContextMenu = memo(function ScheduledDraftContextMenu(
  props: ScheduledDraftContextMenuProps,
) {
  const {
    releases,
    bundleId,
    onCreateRelease,
    onCopyToDrafts,
    onCopyToDraftsNavigate,
    onCreateVersion,
    disabled,
    isGoingToUnpublish = false,
    hasCreatePermission,
    scheduledDraftMenuActions,
    documentId,
    documentType,
    release,
  } = props
  const {t} = useTranslation()
  const hasCopyToDraftOption = useHasCopyToDraftOption(documentType, bundleId)

  const isCopyToReleaseDisabled = disabled || !hasCreatePermission || isGoingToUnpublish
  const copyToReleaseOptions = releases.filter((r) => !isReleaseScheduledOrScheduling(r))
  const isReleasesEnabled = !!useWorkspace().releases?.enabled
  const showCopyToReleaseMenuItem = isReleasesEnabled && copyToReleaseOptions.length > 0

  const {actions} = scheduledDraftMenuActions

  return (
    <Menu>
      <MenuItem {...actions.publishNow} />
      {!isPausedCardinalityOneRelease(release) && <MenuItem {...actions.editSchedule} />}
      <IntentLink
        intent={RELEASES_SCHEDULED_DRAFTS_INTENT}
        params={{view: 'drafts'}}
        rel="noopener noreferrer"
        style={{textDecoration: 'none'}}
      >
        <MenuItem icon={CalendarIcon} text={t('release.action.view-scheduled-drafts')} />
      </IntentLink>
      <MenuDivider />
      {(showCopyToReleaseMenuItem || hasCopyToDraftOption) && (
        <>
          <CopyToReleaseMenuGroup
            releases={copyToReleaseOptions}
            bundleId={bundleId}
            hasCopyToDraftOption={hasCopyToDraftOption}
            isReleasesEnabled={isReleasesEnabled}
            onCreateRelease={onCreateRelease}
            onCopyToDrafts={onCopyToDrafts}
            onCopyToDraftsNavigate={onCopyToDraftsNavigate}
            onCreateVersion={onCreateVersion}
            disabled={isCopyToReleaseDisabled}
            hasCreatePermission={hasCreatePermission}
            documentId={documentId}
            documentType={documentType}
          />
          <MenuDivider />
        </>
      )}
      <MenuItem {...actions.deleteSchedule} />
    </Menu>
  )
})
