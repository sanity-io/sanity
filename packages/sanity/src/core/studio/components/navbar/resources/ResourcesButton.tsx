import React, {useCallback, useMemo, useState} from 'react'
import {HelpCircleIcon} from '@sanity/icons'

import {Button, Card, Heading, Label, Menu, MenuButton, MenuDivider, MenuItem} from '@sanity/ui'
import styled from 'styled-components'

const StyledMenu = styled(Menu)`
  max-width: 350px;
  min-width: 250px;
`

function SubHeader({text}: {text: string}) {
  return (
    <Card paddingTop={3} paddingLeft={3}>
      <Label size={1}>{text}</Label>
    </Card>
  )
}

// må starte studio i staging dersom commites rett i staging i castaway. da kan det testes

export function ResourcesButton() {
  const [open, setOpen] = useState<boolean>(false)

  const handleOpen = useCallback(() => setOpen(!open), [open])

  return (
    <>
      <MenuButton
        button={<Button icon={HelpCircleIcon} onClick={handleOpen} mode="bleed" />}
        id="menu-button-example"
        menu={
          <StyledMenu padding={3}>
            <Card paddingY={2} paddingLeft={3}>
              <Heading as="h5" size={1}>
                Resources & Updates
              </Heading>
            </Card>
            <MenuDivider />
            <SubHeader text="Editors" />
            <MenuItem text="Item 1" />
            <MenuItem text="Item 2" />
            <MenuItem text="Item 3" />
            <MenuDivider />
            <SubHeader text="Developers" />
            <MenuItem text="Item 1" target="_blank" />
            <MenuItem text="Item 2" />
            <MenuItem text="Item 3" />
            <MenuDivider />
            <SubHeader text="General" />
            <MenuItem text="Item 1" />
            <MenuItem text="Item 2" />
            <MenuItem text="Item 3" />
          </StyledMenu>
        }
        placement="bottom"
        popover={{portal: true}}
      />
    </>
  )
}
