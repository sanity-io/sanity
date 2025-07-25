import {HelpCircleIcon} from '@sanity/icons'
import {Menu} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {styled} from 'styled-components'

import {Button, MenuButton} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {SANITY_VERSION} from '../../../../version'
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
  const [studioInfoDialogOpen, setStudioInfoDialogOpen] = useState(false)
  const handleStudioInfoDialogClose = useCallback(() => {
    setStudioInfoDialogOpen(false)
  }, [])

  const handleAboutDialogOpen = useCallback(() => {
    setStudioInfoDialogOpen(true)
  }, [])

  return (
    <>
      {studioInfoDialogOpen && (
        <StudioInfoDialog
          currentVersion={SANITY_VERSION}
          latestVersion={value?.latestVersion}
          onClose={handleStudioInfoDialogClose}
        />
      )}
      <MenuButton
        button={
          <Button
            aria-label={t('help-resources.title')}
            icon={HelpCircleIcon}
            mode="bleed"
            tooltipProps={{content: t('help-resources.title')}}
          />
        }
        id="menu-button-resources"
        menu={
          <StyledMenu data-testid="menu-button-resources">
            <ResourcesMenuItems
              error={error}
              isLoading={isLoading}
              value={value}
              onAboutDialogOpen={handleAboutDialogOpen}
            />
          </StyledMenu>
        }
        popover={{constrainSize: true, tone: 'default'}}
      />
    </>
  )
}
