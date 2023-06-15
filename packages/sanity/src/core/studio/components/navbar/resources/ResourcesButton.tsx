import {HelpCircleIcon} from '@sanity/icons'
import {Button, Menu, MenuButton} from '@sanity/ui'
import React, {useCallback, useState} from 'react'
import styled from 'styled-components'
import {useColorScheme} from '../../../colorScheme'
import {useGetHelpResources} from './helper-functions/hooks'
import {ResourcesMenuItems} from './ResourcesMenuItems'

const StyledMenu = styled(Menu)`
  max-width: 300px;
  min-width: 200px;
`

export function ResourcesButton() {
  const {scheme} = useColorScheme()

  const [open, setOpen] = useState<boolean>(false)

  const handleOpen = useCallback(() => setOpen(!open), [open])
  const {value, error, isLoading} = useGetHelpResources()

  return (
    <>
      <MenuButton
        button={<Button icon={HelpCircleIcon} onClick={handleOpen} mode="bleed" fontSize={2} />}
        id="menu-button-resources"
        menu={
          <StyledMenu>
            <ResourcesMenuItems error={error} isLoading={isLoading} value={value} />
          </StyledMenu>
        }
        popover={{constrainSize: true, placement: 'bottom', portal: true, scheme}}
      />
    </>
  )
}
