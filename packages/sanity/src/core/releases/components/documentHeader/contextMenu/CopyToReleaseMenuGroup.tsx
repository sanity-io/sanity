import {type ReleaseDocument} from '@sanity/client'
import {CopyIcon} from '@sanity/icons/Copy'
import {MenuDivider, Stack} from '@sanity/ui'
import {memo} from 'react'
import {styled} from 'styled-components'

import {MenuGroup} from '../../../../../ui-components/menuGroup/MenuGroup'
import {MenuItem} from '../../../../../ui-components/menuItem/MenuItem'
import {type PopoverProps} from '../../../../../ui-components/popover/Popover'
import {useTranslation} from '../../../../i18n'
import {CreateReleaseMenuItem} from '../../CreateReleaseMenuItem'
import {CopyToDraftsMenuItem} from './CopyToDraftsMenuItem'
import {VersionContextMenuItem} from './VersionContextMenuItem'

const ReleasesList = styled(Stack)`
  max-width: 300px;
  max-height: 200px;
  overflow-y: auto;
`

const SUBMENU_POPOVER_PROPS: PopoverProps = {
  placement: 'right-start',
  fallbackPlacements: ['left-start'],
}

interface CopyToReleaseMenuGroupProps {
  releases: ReleaseDocument[]
  bundleId: string
  onCreateRelease: () => void
  onCopyToDrafts: () => void
  onCopyToDraftsNavigate: () => void
  onCreateVersion: (targetId: string) => void
  disabled: boolean
  hasCreatePermission: boolean | null
  documentId: string
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
    onCopyToDraftsNavigate,
    onCreateVersion,
    disabled,
    isReleasesEnabled,
    hasCreatePermission,
    hasCopyToDraftOption,
    documentId,
    documentType,
  } = props
  const {t} = useTranslation()

  return (
    <MenuGroup
      icon={CopyIcon}
      popover={SUBMENU_POPOVER_PROPS}
      text={t('release.action.copy-to')}
      disabled={disabled}
      tooltipProps={{
        disabled: hasCreatePermission === true,
        content: t('release.action.permission.error'),
      }}
      data-testid="copy-version-to-release-button-group"
    >
      {(hasCopyToDraftOption || releases.length > 0) && (
        <ReleasesList key={bundleId} space={1}>
          {hasCopyToDraftOption && (
            <CopyToDraftsMenuItem
              documentType={documentType}
              documentId={documentId}
              fromRelease={bundleId}
              onClick={onCopyToDrafts}
              onNavigate={onCopyToDraftsNavigate}
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
