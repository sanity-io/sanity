import {type ReleaseDocument} from '@sanity/client'
import {CalendarIcon} from '@sanity/icons/Calendar'
import {Menu, MenuDivider} from '@sanity/ui/menu'
import {memo} from 'react'
import {IntentLink} from 'sanity/router'

import {MenuItem} from '../../../../../ui-components/menuItem/MenuItem'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {type UseScheduledDraftMenuActionsReturn} from '../../../../singleDocRelease/hooks/useScheduledDraftMenuActions'
import {RELEASES_SCHEDULED_DRAFTS_INTENT} from '../../../../singleDocRelease/plugin'
import {useWorkspace} from '../../../../studio/workspace'
import {isPausedCardinalityOneRelease} from '../../../../util/releaseUtils'
import {type CopyToDraftsOptions} from '../../../hooks/useCopyToDrafts'
import {isReleaseScheduledOrScheduling} from '../../../util/util'
import {useHasCopyToDraftOption} from './CopyToDraftsMenuItem'
import {CopyToReleaseMenuGroup} from './CopyToReleaseMenuGroup'

interface ScheduledDraftContextMenuProps {
  releases: ReleaseDocument[]
  bundleId: string
  onCreateRelease: () => void
  onCopyToDrafts: (options: CopyToDraftsOptions) => Promise<void>
  onCreateVersion: (targetId: string) => void
  disabled?: boolean
  isGoingToUnpublish?: boolean
  hasCreatePermission: boolean | null
  scheduledDraftMenuActions: UseScheduledDraftMenuActionsReturn
  documentType: string
  release?: ReleaseDocument
  /**
   * Whether the Publish now action is configured in `document.actions`.
   * Defaults to `true`.
   */
  showPublishNow?: boolean
  /**
   * Whether the Edit schedule action is configured in `document.actions`.
   * Defaults to `true`.
   */
  showEditSchedule?: boolean
  /**
   * Whether the Delete schedule action is configured in `document.actions`.
   * Defaults to `true`.
   */
  showDeleteSchedule?: boolean
}

export const ScheduledDraftContextMenu = memo(function ScheduledDraftContextMenu(
  props: ScheduledDraftContextMenuProps,
) {
  const {
    releases,
    bundleId,
    onCreateRelease,
    onCopyToDrafts,
    onCreateVersion,
    disabled,
    isGoingToUnpublish = false,
    hasCreatePermission,
    scheduledDraftMenuActions,
    documentType,
    release,
    showPublishNow = true,
    showEditSchedule = true,
    showDeleteSchedule = true,
  } = props
  const {t} = useTranslation()
  const hasCopyToDraftOption = useHasCopyToDraftOption(documentType, bundleId)

  const isCopyToReleaseDisabled = disabled || !hasCreatePermission || isGoingToUnpublish
  const copyToReleaseOptions = releases.filter((r) => !isReleaseScheduledOrScheduling(r))
  const isReleasesEnabled = !!useWorkspace().releases?.enabled
  const showCopyToReleaseMenuItem = isReleasesEnabled && copyToReleaseOptions.length > 0
  const showCopySection = showCopyToReleaseMenuItem || hasCopyToDraftOption
  const showEditScheduleItem = showEditSchedule && !isPausedCardinalityOneRelease(release)

  const {actions} = scheduledDraftMenuActions

  return (
    <Menu>
      {showPublishNow && <MenuItem {...actions.publishNow} />}
      {showEditScheduleItem && <MenuItem {...actions.editSchedule} />}
      <IntentLink
        intent={RELEASES_SCHEDULED_DRAFTS_INTENT}
        params={{view: 'drafts'}}
        rel="noopener noreferrer"
        style={{textDecoration: 'none'}}
      >
        <MenuItem icon={CalendarIcon} text={t('release.action.view-scheduled-drafts')} />
      </IntentLink>
      {(showCopySection || showDeleteSchedule) && <MenuDivider />}
      {showCopySection && (
        <>
          <CopyToReleaseMenuGroup
            releases={copyToReleaseOptions}
            bundleId={bundleId}
            hasCopyToDraftOption={hasCopyToDraftOption}
            isReleasesEnabled={isReleasesEnabled}
            onCreateRelease={onCreateRelease}
            onCopyToDrafts={onCopyToDrafts}
            onCreateVersion={onCreateVersion}
            disabled={isCopyToReleaseDisabled}
            hasCreatePermission={hasCreatePermission}
            documentType={documentType}
          />
          {showDeleteSchedule && <MenuDivider />}
        </>
      )}
      {showDeleteSchedule && <MenuItem {...actions.deleteSchedule} />}
    </Menu>
  )
})
