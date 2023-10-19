import {HelpCircleIcon} from '@sanity/icons'
import {Button, Flex, Menu, MenuButton, Text} from '@sanity/ui'
import React, {useCallback, useState} from 'react'
import styled from 'styled-components'
import {useColorScheme} from '../../../colorScheme'
import {Tooltip} from '../../../../../ui'
import {useGetHelpResources} from './helper-functions/hooks'
import {ResourcesMenuItems} from './ResourcesMenuItems'

const StyledMenu = styled(Menu)`
  max-width: 300px;
  min-width: 200px;
`

export function ResourcesButton() {
  const {scheme} = useColorScheme()
  const [menuOpen, setMenuOpen] = useState(false)

  const {value, error, isLoading} = useGetHelpResources()

  const handleOnOpen = useCallback(() => setMenuOpen(true), [])
  const handleOnClose = useCallback(() => setMenuOpen(false), [])

  return (
    <Flex>
      <Tooltip
        content={<Text size={1}>Help and resources</Text>}
        scheme={scheme}
        placement="bottom"
        portal
        disabled={menuOpen}
      >
        <div>
          <MenuButton
            button={
              <Button
                aria-label="Help and resources"
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
