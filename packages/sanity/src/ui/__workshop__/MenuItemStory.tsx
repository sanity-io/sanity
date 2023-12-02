import {hues} from '@sanity/color'
import {CheckmarkIcon, CircleIcon} from '@sanity/icons'
import {Avatar, Box, Card, Container, Menu, MenuDivider, Text} from '@sanity/ui'
import {useString} from '@sanity/ui-workshop'
import React from 'react'
import {MenuItem} from '../menuItem'

const HOTKEYS = ['Ctrl', 'Alt', 'P']
const AVATAR_INITIALS = 'A.W.'

export default function MenuItemStory() {
  const subtitle = useString('Subtitle', 'Subtitle', 'Props') || ''
  const text = useString('Text', 'Text', 'Props') || ''

  return (
    <Container width={0} padding={4}>
      <Card border>
        <Menu>
          <MenuItem text={text} />
          <MenuItem icon={CircleIcon} text={text} />
          <MenuItem iconRight={CheckmarkIcon} text={text} />
          <MenuItem hotkeys={HOTKEYS} text={text} />
          <MenuItem
            preview={<Avatar initials={AVATAR_INITIALS} size={1} />}
            text={text}
            subtitle={subtitle}
          />
          <MenuItem
            preview={<Avatar initials={AVATAR_INITIALS} size={1} />}
            text={text}
            subtitle={subtitle}
            iconRight={CheckmarkIcon}
          />
          <MenuItem
            preview={<Avatar initials={AVATAR_INITIALS} size={1} />}
            text={text}
            subtitle={subtitle}
            badgeText="badge"
          />
          <MenuDivider />
          <Box padding={2}>
            <Text size={1}>Not recommended</Text>
          </Box>
          <Box paddingX={2} paddingTop={2}>
            <Text size={0}> Don&apos;t use left icons in large menu items</Text>
          </Box>

          <MenuItem icon={CircleIcon} text={text} subtitle={subtitle} />
          <Box paddingX={2} paddingTop={2}>
            <Text size={0}>Don&apos;t use keyboard shortcuts with large menu items</Text>
          </Box>
          <MenuItem text={text} hotkeys={HOTKEYS} subtitle={subtitle} />
          <Box paddingX={2} paddingTop={2}>
            <Text size={0}>Don&apos;t use badges in small menu items</Text>
          </Box>
          <MenuItem text={text} badgeText={'badge'} />
          <Box paddingX={2} paddingTop={2}>
            <Text size={0}>Don&apos;t use icons and previews in the same item</Text>
          </Box>
          <MenuItem
            icon={CircleIcon}
            preview={
              <Card
                radius={2}
                style={{width: '41px', height: '41px', background: hues.cyan[500].hex}}
              />
            }
            text={text}
            subtitle={subtitle}
          />
          <Box paddingX={2} paddingTop={2}>
            <Text size={0}>Don&apos;t use icon right and hotkeys in the same item</Text>
          </Box>
          <MenuItem icon={CircleIcon} text={text} iconRight={CheckmarkIcon} hotkeys={HOTKEYS} />
          <Box paddingX={2} paddingTop={2}>
            <Text size={0}>Don&apos;t use icon right and badge in the same item</Text>
          </Box>
          <MenuItem icon={CircleIcon} text={text} iconRight={CheckmarkIcon} badgeText={'badge'} />
          <Box paddingX={2} paddingTop={2}>
            <Text size={0}>Don&apos;t use hotkeys and badge in the same item</Text>
          </Box>
          <MenuItem icon={CircleIcon} text={text} hotkeys={HOTKEYS} badgeText={'badge'} />
          <Box paddingX={2} paddingTop={2}>
            <Text size={0}>Don&apos;t use everything at once</Text>
          </Box>
          <MenuItem
            icon={CircleIcon}
            text={text}
            hotkeys={HOTKEYS}
            badgeText={'badge'}
            iconRight={CheckmarkIcon}
          />
          <MenuItem
            preview={<Avatar initials={AVATAR_INITIALS} size={1} />}
            subtitle={subtitle}
            icon={CircleIcon}
            text={text}
            hotkeys={HOTKEYS}
            badgeText={'badge'}
            iconRight={CheckmarkIcon}
          />
        </Menu>
      </Card>
    </Container>
  )
}
