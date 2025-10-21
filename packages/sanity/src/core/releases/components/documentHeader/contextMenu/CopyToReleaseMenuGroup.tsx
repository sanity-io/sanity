import {type ReleaseDocument} from '@sanity/client'
import {CopyIcon} from '@sanity/icons'
import {MenuDivider, Stack} from '@sanity/ui'
import {memo} from 'react'
import {styled} from 'styled-components'

import {MenuGroup} from '../../../../../ui-components/menuGroup/MenuGroup'
import {MenuItem} from '../../../../../ui-components/menuItem/MenuItem'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {isReleaseScheduledOrScheduling} from '../../../util/util'
import {CreateReleaseMenuItem} from '../../CreateReleaseMenuItem'
import {VersionContextMenuItem} from './VersionContextMenuItem'

const ReleasesList = styled(Stack)`
  max-width: 300px;
  max-height: 200px;
  overflow-y: auto;
`

interface CopyToReleaseMenuGroupProps {
  releases: ReleaseDocument[]
  fromRelease: string
  onCreateRelease: () => void
  onCreateVersion: (targetId: string) => void
  disabled: boolean
  hasCreatePermission: boolean | null
}

export const CopyToReleaseMenuGroup = memo(function CopyToReleaseMenuGroup(
  props: CopyToReleaseMenuGroupProps,
) {
  const {releases, fromRelease, onCreateRelease, onCreateVersion, disabled, hasCreatePermission} =
    props
  const {t} = useTranslation()

  const optionsReleaseList = releases.filter((r) => !isReleaseScheduledOrScheduling(r))

  return (
    <MenuGroup
      icon={CopyIcon}
      popover={{placement: 'right-start'}}
      text={t('release.action.copy-to')}
      disabled={disabled}
      tooltipProps={{
        disabled: hasCreatePermission === true,
        content: t('release.action.permission.error'),
      }}
      data-testid="copy-version-to-release-button-group"
    >
      <ReleasesList key={fromRelease} space={1}>
        {optionsReleaseList.map((targetRelease) => {
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
      {optionsReleaseList.length > 1 && <MenuDivider />}
      <CreateReleaseMenuItem onCreateRelease={onCreateRelease} />
    </MenuGroup>
  )
})
