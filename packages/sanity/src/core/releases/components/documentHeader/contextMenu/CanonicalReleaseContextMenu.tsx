import {type ReleaseDocument} from '@sanity/client'
import {CalendarIcon, TrashIcon} from '@sanity/icons'
import {Menu, MenuDivider, Spinner} from '@sanity/ui'
import {memo} from 'react'
import {IntentLink} from 'sanity/router'

import {MenuItem} from '../../../../../ui-components/menuItem/MenuItem'
import {useTranslation} from '../../../../i18n'
import {RELEASES_INTENT} from '../../../plugin'
import {isReleaseScheduledOrScheduling} from '../../../util/util'
import {useHasCopyToDraftOption} from './CopyToDraftsMenuItem'
import {CopyToReleaseMenuGroup} from './CopyToReleaseMenuGroup'

interface CanonicalReleaseContextMenuProps {
  releases: ReleaseDocument[]
  releasesLoading: boolean
  fromRelease: string
  isVersion: boolean
  onDiscard: () => void
  onCreateRelease: () => void
  onCopyToDrafts: () => void
  onCopyToDraftsNavigate: () => void
  onCreateVersion: (targetId: string) => void
  disabled?: boolean
  locked?: boolean
  isGoingToUnpublish?: boolean
  hasCreatePermission: boolean | null
  hasDiscardPermission: boolean
  isPublished: boolean
  documentId: string
  documentType: string
}

export const CanonicalReleaseContextMenu = memo(function CanonicalReleaseContextMenu(
  props: CanonicalReleaseContextMenuProps,
) {
  const {
    releases,
    releasesLoading,
    fromRelease,
    isVersion,
    onDiscard,
    onCreateRelease,
    onCopyToDrafts,
    onCopyToDraftsNavigate,
    onCreateVersion,
    disabled,
    locked,
    isGoingToUnpublish = false,
    hasCreatePermission,
    hasDiscardPermission,
    isPublished,
    documentId,
    documentType,
  } = props
  const {t} = useTranslation()
  const hasCopyToDraftOption = useHasCopyToDraftOption(documentType, fromRelease)

  const isCopyToReleaseDisabled = disabled || !hasCreatePermission || isGoingToUnpublish
  const copyToReleaseOptions = releases.filter((r) => !isReleaseScheduledOrScheduling(r))
  const showCopyToReleaseMenuItem = copyToReleaseOptions.length > 0 || hasCopyToDraftOption

  return (
    <Menu>
      {isVersion && (
        <IntentLink
          intent={RELEASES_INTENT}
          params={{id: fromRelease}}
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
          fromRelease={fromRelease}
          onCreateRelease={onCreateRelease}
          onCopyToDrafts={onCopyToDrafts}
          onCopyToDraftsNavigate={onCopyToDraftsNavigate}
          onCreateVersion={onCreateVersion}
          disabled={isCopyToReleaseDisabled}
          hasCreatePermission={hasCreatePermission}
          documentId={documentId}
          documentType={documentType}
        />
      )}
      {(isVersion || showCopyToReleaseMenuItem) && !isPublished && <MenuDivider />}
      {!isPublished && (
        <MenuItem
          icon={TrashIcon}
          onClick={onDiscard}
          text={t('release.action.discard-version')}
          tone="critical"
          disabled={disabled || locked || !hasDiscardPermission}
          tooltipProps={{
            disabled: hasDiscardPermission === true,
            content: t('release.action.permission.error'),
          }}
        />
      )}
    </Menu>
  )
})
