import {HelpCircleIcon} from '@sanity/icons'
import {Menu} from '@sanity/ui'
import {styled} from 'styled-components'

import {Button} from '../../../../../ui-components/button'
import {MenuButton} from '../../../../../ui-components/menuButton'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {useGetHelpResources} from './helper-functions/hooks'
import {ResourcesMenuItems} from './ResourcesMenuItems'

const StyledMenu = styled(Menu)`
  max-width: 300px;
  min-width: 200px;
`

export function ResourcesButton() {
  const {t} = useTranslation()

  const {value, error, isLoading} = useGetHelpResources()

  return (
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
          <ResourcesMenuItems error={error} isLoading={isLoading} value={value} />
        </StyledMenu>
      }
      popover={{constrainSize: true, tone: 'default'}}
    />
  )
}
