import {CheckmarkIcon, WarningOutlineIcon} from '@sanity/icons'
import {Box, Card, Menu, MenuDivider} from '@sanity/ui'
import {useString} from '@sanity/ui-workshop'
import React from 'react'
import {MenuItem} from '../menuItem'

const HOTKEYS = ['Ctrl', 'Alt', 'P']

export default function MenuItemStory() {
  const subtitle = useString('Subtitle', 'Subtitle', 'Props') || ''
  const text = useString('Text', 'Text', 'Props') || ''

  return (
    <Box padding={4}>
      <Card border>
        <Menu>
          <MenuItem text={text} />
          <MenuItem iconRight={CheckmarkIcon} text={text} />
          <MenuItem hotkeys={HOTKEYS} text={text} />
          <MenuItem hotkeys={HOTKEYS} iconRight={CheckmarkIcon} text={text} />
          <MenuDivider />
          <MenuItem icon={WarningOutlineIcon} text={text} />
          <MenuItem icon={WarningOutlineIcon} iconRight={CheckmarkIcon} text={text} />
          <MenuItem hotkeys={HOTKEYS} icon={WarningOutlineIcon} text={text} />
          <MenuItem
            hotkeys={HOTKEYS}
            icon={WarningOutlineIcon}
            iconRight={CheckmarkIcon}
            text={text}
          />
          <MenuDivider />
          <MenuItem subtitle={subtitle} text={text} />
          <MenuItem iconRight={CheckmarkIcon} subtitle={subtitle} text={text} />
          <MenuItem hotkeys={HOTKEYS} subtitle={subtitle} text={text} />
          <MenuItem hotkeys={HOTKEYS} iconRight={CheckmarkIcon} subtitle={subtitle} text={text} />
          <MenuDivider />
          <MenuItem icon={WarningOutlineIcon} subtitle={subtitle} text={text} />
          <MenuItem
            icon={WarningOutlineIcon}
            iconRight={CheckmarkIcon}
            subtitle={subtitle}
            text={text}
          />
          <MenuItem hotkeys={HOTKEYS} icon={WarningOutlineIcon} subtitle={subtitle} text={text} />
          <MenuItem
            hotkeys={HOTKEYS}
            icon={WarningOutlineIcon}
            iconRight={CheckmarkIcon}
            subtitle={subtitle}
            text={text}
          />
        </Menu>
      </Card>
    </Box>
  )
}
