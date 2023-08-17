import {HelpCircleIcon} from '@sanity/icons'
import {Box, Button, Flex, Menu, MenuButton, Text, Tooltip} from '@sanity/ui'
import React, {useCallback, useState} from 'react'
import styled from 'styled-components'
import {useColorScheme} from '../../../colorScheme'
import {useTranslation} from '../../../../i18n'
import {useGetHelpResources} from './helper-functions/hooks'
import {ResourcesMenuItems} from './ResourcesMenuItems'

const StyledMenu = styled(Menu)`
  max-width: 300px;
  min-width: 200px;
`

export function ResourcesButton() {
  const {scheme} = useColorScheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const {t} = useTranslation()

  const {value, error, isLoading} = useGetHelpResources()

  const handleOnOpen = useCallback(() => setMenuOpen(true), [])
  const handleOnClose = useCallback(() => setMenuOpen(false), [])

  return (
    <Flex>
      <Tooltip
        content={
          <Box padding={2}>
            <Text size={1}>{t('navbar.helpResources.title')}</Text>
          </Box>
        }
        scheme={scheme}
        placement="bottom"
        portal
        disabled={menuOpen}
      >
        <div>
          <MenuButton
            button={
              <Button
                aria-label={t('navbar.helpResources.title')}
                icon={HelpCircleIcon}
                mode="bleed"
                fontSize={2}
              />
            }
            id="menu-button-resources"
            menu={
              <StyledMenu>
                <ResourcesMenuItems error={error} isLoading={isLoading} value={value} />
              </StyledMenu>
            }
            popover={{constrainSize: true, placement: 'bottom', portal: true, scheme}}
            onClose={handleOnClose}
            onOpen={handleOnOpen}
          />
        </div>
      </Tooltip>
    </Flex>
  )
}
