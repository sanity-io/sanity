import {InfoOutlineIcon} from '@sanity/icons'
import {Flex, Menu, MenuButton} from '@sanity/ui'
import React, {useCallback, useState} from 'react'
import styled from 'styled-components'
import {useColorScheme} from '../../../colorScheme'
import {Button} from '../../../../../ui'
import {useGetHelpResources} from './helper-functions/hooks'
import {ResourcesMenuItems} from './ResourcesMenuItems'

const StyledMenu = styled(Menu)`
  max-width: 300px;
  min-width: 200px;
`

export function ResourcesButton() {
  const {scheme} = useColorScheme()

  const {value, error, isLoading} = useGetHelpResources()

  return (
    <Flex>
      <MenuButton
        button={
          <Button
            aria-label="Help and resources"
            icon={InfoOutlineIcon}
            mode="bleed"
            tooltipProps={{
              content: 'Help and resources',
              scheme: scheme,
              placement: 'bottom',
              portal: true,
            }}
          />
        }
        id="menu-button-resources"
        menu={
          <StyledMenu>
            <ResourcesMenuItems error={error} isLoading={isLoading} value={value} />
          </StyledMenu>
        }
        popover={{constrainSize: true, placement: 'bottom', portal: true, scheme}}
      />
    </Flex>
  )
}
