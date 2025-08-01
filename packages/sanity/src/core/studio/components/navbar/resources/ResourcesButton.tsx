import {HelpCircleIcon} from '@sanity/icons'
import {Menu} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {styled} from 'styled-components'

import {MenuButton} from '../../../../../ui-components'
import {StatusButton} from '../../../../components'
import {useTranslation} from '../../../../i18n'
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

  const {isAutoUpdating, packageVersionInfo} = usePackageVersionStatus()
  const newAutoUpdateVersion = isAutoUpdating
    ? packageVersionInfo.find((pkg) => pkg.canUpdate)?.available
    : undefined
  const [studioInfoDialogOpen, setStudioInfoDialogOpen] = useState(false)
  const handleStudioInfoDialogClose = useCallback(() => {
    setStudioInfoDialogOpen(false)
  }, [])

  const handleOpenVersionDialog = useCallback(() => {
    setStudioInfoDialogOpen(true)
  }, [])

  return (
    <>
      {studioInfoDialogOpen && (
        <StudioInfoDialog
          latestVersion={value?.latestVersion}
          onClose={handleStudioInfoDialogClose}
        />
      )}
      <MenuButton
        button={
          <StatusButton
            tone={newAutoUpdateVersion ? 'primary' : undefined}
            aria-label={t('help-resources.title')}
            icon={HelpCircleIcon}
            mode="bleed"
            tooltipProps={{content: t('help-resources.title')}}
          />
        }
        id="menu-button-resources"
        data-testid="resources-menu-button"
        menu={
          <StyledMenu data-testid="menu-button-resources">
            <ResourcesMenuItems
              newAutoUpdateVersion={newAutoUpdateVersion}
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
