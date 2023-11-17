import {InfoOutlineIcon} from '@sanity/icons'
import {Menu, MenuButton} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'
import {Button} from '../../../../../ui'
import {useGetHelpResources} from './helper-functions/hooks'
import {ResourcesMenuItems} from './ResourcesMenuItems'

const StyledMenu = styled(Menu)`
  max-width: 300px;
  min-width: 200px;
`

export function ResourcesButton() {
  const {value, error, isLoading} = useGetHelpResources()

  return (
    <MenuButton
      button={
        <Button
          aria-label="Help and resources"
          icon={InfoOutlineIcon}
          mode="bleed"
          tooltipProps={{content: 'Help and resources'}}
        />
      }
      id="menu-button-resources"
      menu={
        <StyledMenu>
          <ResourcesMenuItems error={error} isLoading={isLoading} value={value} />
        </StyledMenu>
      }
      popover={{constrainSize: true}}
    />
  )
}
