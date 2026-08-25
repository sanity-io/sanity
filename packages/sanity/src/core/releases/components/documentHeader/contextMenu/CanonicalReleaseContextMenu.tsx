import {type ReleaseDocument} from '@sanity/client'
import {CalendarIcon} from '@sanity/icons/Calendar'
import {TrashIcon} from '@sanity/icons/Trash'
import {Spinner} from '@sanity/ui'
import {Menu, MenuDivider} from '@sanity/ui/menu'
import {memo} from 'react'
import {IntentLink} from 'sanity/router'

import {MenuItem} from '../../../../../ui-components/menuItem/MenuItem'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {useWorkspace} from '../../../../studio/workspace'
import {type CopyToDraftsOptions} from '../../../hooks/useCopyToDrafts'
import {RELEASES_INTENT} from '../../../plugin'
import {isReleaseScheduledOrScheduling} from '../../../util/util'
import {useHasCopyToDraftOption} from './CopyToDraftsMenuItem'
import {CopyToReleaseMenuGroup} from './CopyToReleaseMenuGroup'

interface CanonicalReleaseContextMenuProps {
  bundleId: string
  release?: ReleaseDocument
  onDiscard: () => void
  onCreateRelease: () => void
  onCopyToDrafts: (options: CopyToDraftsOptions) => Promise<void>
  onCreateVersion: (targetId: string) => void
  disabled?: boolean
  locked?: boolean
  isGoingToUnpublish?: boolean
  hasCreatePermission: boolean | null
  hasDiscardPermission: boolean
  isPublished: boolean
  /**
   * Whether the UI permits discarding versions, which includes whether the
   * discard action is still configured in `document.actions`.
   * Defaults to `true`.
   */
  isDiscardable?: boolean
  documentType: string
  releases: ReleaseDocument[]
  releasesLoading: boolean
}

export const CanonicalReleaseContextMenu = memo(function CanonicalReleaseContextMenu(
  props: CanonicalReleaseContextMenuProps,
) {
  const {
    releases,
    releasesLoading,
    bundleId,
    onDiscard,
    onCreateRelease,
    onCopyToDrafts,
    onCreateVersion,
    disabled,
    locked,
    release,
    isGoingToUnpublish = false,
    hasCreatePermission,
    hasDiscardPermission,
    isPublished,
    isDiscardable = true,
    documentType,
  } = props
  const {t} = useTranslation()
  const hasCopyToDraftOption = useHasCopyToDraftOption(documentType, bundleId)

  const isCopyToReleaseDisabled = disabled || !hasCreatePermission || isGoingToUnpublish
  const copyToReleaseOptions = releases.filter((r) => !isReleaseScheduledOrScheduling(r))
  const isReleasesEnabled = !!useWorkspace().releases?.enabled

  const showCopyToReleaseMenuItem = isReleasesEnabled || hasCopyToDraftOption

  return (
    <Menu>
      {release && (
        <IntentLink
          intent={RELEASES_INTENT}
          params={{id: bundleId}}
          rel="noopener noreferrer"
          style={{textDecoration: 'none'}}
          disabled={disabled}
        >
          <MenuItem icon={CalendarIcon} text={t('release.action.view-release')} />
        </IntentLink>
      )}
      {releasesLoading && <Spinner />}
      {showCopyToReleaseMenuItem && (
        <CopyToReleaseMenuGroup
          releases={copyToReleaseOptions}
          hasCopyToDraftOption={hasCopyToDraftOption}
          isReleasesEnabled={isReleasesEnabled}
          bundleId={bundleId}
          onCreateRelease={onCreateRelease}
          onCopyToDrafts={onCopyToDrafts}
          onCreateVersion={onCreateVersion}
          disabled={isCopyToReleaseDisabled}
          hasCreatePermission={hasCreatePermission}
          documentType={documentType}
        />
      )}
      {!isPublished && isDiscardable && (showCopyToReleaseMenuItem || release) && <MenuDivider />}
      {!isPublished && isDiscardable && (
        <MenuItem
          icon={TrashIcon}
          onClick={onDiscard}
          text={t('release.action.discard-version')}
          tone="critical"
          disabled={disabled || locked || !hasDiscardPermission}
          tooltipProps={{
            disabled: hasDiscardPermission,
            content: t('release.action.permission.error'),
          }}
        />
      )}
    </Menu>
  )
})
