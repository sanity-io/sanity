import {type ReleaseDocument} from '@sanity/client'
import {CopyIcon} from '@sanity/icons/Copy'
import {MenuDivider, Stack} from '@sanity/ui'
import {memo} from 'react'
import {styled} from 'styled-components'

import {MenuGroup} from '../../../../../ui-components/menuGroup/MenuGroup'
import {MenuItem} from '../../../../../ui-components/menuItem/MenuItem'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {type CopyToDraftsOptions} from '../../../hooks/useCopyToDrafts'
import {CreateReleaseMenuItem} from '../../CreateReleaseMenuItem'
import {CopyToDraftsMenuItem} from './CopyToDraftsMenuItem'
import {VersionContextMenuItem} from './VersionContextMenuItem'

const ReleasesList = styled(Stack)`
  max-width: 300px;
  max-height: 200px;
  overflow-y: auto;
`

interface CopyToReleaseMenuGroupProps {
  releases: ReleaseDocument[]
  bundleId: string
  onCreateRelease: () => void
  onCopyToDrafts: (options: CopyToDraftsOptions) => Promise<void>
  onCreateVersion: (targetId: string) => void
  disabled: boolean
  hasCreatePermission: boolean | null
  documentType: string
  hasCopyToDraftOption?: boolean
  isReleasesEnabled?: boolean
}

export const CopyToReleaseMenuGroup = memo(function CopyToReleaseMenuGroup(
  props: CopyToReleaseMenuGroupProps,
) {
  const {
    releases,
    bundleId,
    onCreateRelease,
    onCopyToDrafts,
    onCreateVersion,
    disabled,
    isReleasesEnabled,
    hasCreatePermission,
    hasCopyToDraftOption,
    documentType,
  } = props
  const {t} = useTranslation()

  return (
    <MenuGroup
      icon={CopyIcon}
      popover={{placement: 'right-start', fallbackPlacements: ['left-start']}}
      text={t('release.action.copy-to')}
      disabled={disabled}
      tooltipProps={{
        disabled: hasCreatePermission === true,
        content: t('release.action.permission.error'),
      }}
      data-testid="copy-version-to-release-button-group"
    >
      {(hasCopyToDraftOption || releases.length > 0) && (
        <ReleasesList key={bundleId} gap={1}>
          {hasCopyToDraftOption && (
            <CopyToDraftsMenuItem
              documentType={documentType}
              fromRelease={bundleId}
              onClick={onCopyToDrafts}
            />
          )}
          {releases.map((targetRelease) => {
            return (
              <MenuItem
                key={targetRelease._id}
                as="a"
                onClick={() => onCreateVersion(targetRelease._id)}
                renderMenuItem={() => <VersionContextMenuItem release={targetRelease} />}
              />
            )
          })}
        </ReleasesList>
      )}
      {isReleasesEnabled && (hasCopyToDraftOption || releases.length > 0) && <MenuDivider />}
      {isReleasesEnabled && <CreateReleaseMenuItem onCreateRelease={onCreateRelease} />}
    </MenuGroup>
  )
})
