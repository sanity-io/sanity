import {HelpCircleIcon} from '@sanity/icons'
import {Menu} from '@sanity/ui'
import {useCallback, useState} from 'react'
import semver from 'semver'
import {styled} from 'styled-components'

import {MenuButton} from '../../../../../ui-components/menuButton/MenuButton'
import {StatusButton} from '../../../../components/StatusButton'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {usePackageVersionStatus} from '../../../packageVersionStatus/usePackageVersionStatus'
import {useGetHelpResources} from './helper-functions/hooks'
import {ResourcesMenuItems} from './ResourcesMenuItems'
import {StudioInfoDialog} from './StudioInfoDialog'

const StyledMenu = styled(Menu)`
  max-width: 300px;
  min-width: 200px;
`

export function ResourcesButton() {
  const {t} = useTranslation()

  const {value, error, isLoading} = useGetHelpResources()

  const {
    autoUpdatingVersion: autoUpdatingVersionStr,
    currentVersion: currentVersionStr,
    latestTaggedVersion: latestTaggedVersionStr,
  } = usePackageVersionStatus()

  const currentVersion = semver.parse(currentVersionStr)!
  const autoUpdatingVersion = semver.parse(autoUpdatingVersionStr) || undefined
  const latestTaggedVersion = semver.parse(latestTaggedVersionStr) || undefined

  const newAutoUpdateVersionAvailable =
    currentVersion && autoUpdatingVersion ? semver.neq(currentVersion, autoUpdatingVersion) : false

  const [studioInfoDialogOpen, setStudioInfoDialogOpen] = useState(false)
  const handleStudioInfoDialogClose = useCallback(() => {
    setStudioInfoDialogOpen(false)
  }, [])

  const handleOpenVersionDialog = useCallback(() => {
    setStudioInfoDialogOpen(true)
  }, [])

  return (
    <>
      {studioInfoDialogOpen && <StudioInfoDialog onClose={handleStudioInfoDialogClose} />}
      <MenuButton
        button={
          <StatusButton
            tone={newAutoUpdateVersionAvailable ? 'primary' : undefined}
            aria-label={t('help-resources.title')}
            icon={HelpCircleIcon}
            data-testid="button-resources-menu"
            mode="bleed"
            tooltipProps={{content: t('help-resources.title')}}
          />
        }
        id="menu-button-resources"
        menu={
          <StyledMenu data-testid="menu-button-resources">
            <ResourcesMenuItems
              currentVersion={currentVersion}
              latestTaggedVersion={latestTaggedVersion}
              newAutoUpdateVersion={newAutoUpdateVersionAvailable ? autoUpdatingVersion : undefined}
              error={error}
              isLoading={isLoading}
              value={value}
              onOpenStudioVersionDialog={handleOpenVersionDialog}
            />
          </StyledMenu>
        }
        popover={{constrainSize: true, tone: 'default'}}
      />
    </>
  )
}
