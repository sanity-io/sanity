import {hues} from '@sanity/color'
import {CheckmarkIcon, CircleIcon} from '@sanity/icons'
import {Avatar, Box, Card, Container, Menu, Stack, Text} from '@sanity/ui'
import {useString} from '@sanity/ui-workshop'
import React from 'react'
import {MenuItem} from '../menuItem'

const HOTKEYS = ['Ctrl', 'Alt', 'P']
const AVATAR_INITIALS = 'A.W.'

export default function MenuItemStory() {
  const text = useString('Text', 'Text', 'Props') || ''

  return (
    <Container width={0} padding={4}>
      <Stack space={2}>
        <Card border radius={2}>
          <Box marginBottom={3} padding={3}>
            <Text size={2} weight="medium">
              Recommended usage
            </Text>
          </Box>
          <Menu>
            <MenuItem text={text} />
            <MenuItem icon={CircleIcon} text={text} />
            <MenuItem iconRight={CheckmarkIcon} text={text} />
            <MenuItem hotkeys={HOTKEYS} text={text} />
            <MenuItem preview={<Avatar initials={AVATAR_INITIALS} size={1} />} text={text} />
            <MenuItem
              preview={<Avatar initials={AVATAR_INITIALS} size={1} />}
              text={text}
              iconRight={CheckmarkIcon}
            />
            <MenuItem
              preview={<Avatar initials={AVATAR_INITIALS} size={1} />}
              text={text}
              badgeText="badge"
            />
          </Menu>
        </Card>
        <Card border radius={2} tone="critical">
          <Box marginBottom={3} padding={3}>
            <Text size={2} weight="medium">
              Invalid usage
            </Text>
          </Box>
          <Menu>
            <Box paddingX={2} paddingTop={2}>
              <Text muted size={1}>
                Don&apos;t use icons and previews in the same item
              </Text>
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
            />
            <Box paddingX={2} paddingTop={2}>
              <Text muted size={1}>
                Don't use icon right and hotkeys in the same item
              </Text>
            </Box>
            <MenuItem icon={CircleIcon} text={text} iconRight={CheckmarkIcon} hotkeys={HOTKEYS} />
            <Box paddingX={2} paddingTop={2}>
              <Text muted size={1}>
                Don't use icon right and badge in the same item
              </Text>
            </Box>
            <MenuItem icon={CircleIcon} text={text} iconRight={CheckmarkIcon} badgeText={'badge'} />
            <Box paddingX={2} paddingTop={2}>
              <Text muted size={1}>
                Don't use hotkeys and badge in the same item
              </Text>
            </Box>
            <MenuItem icon={CircleIcon} text={text} hotkeys={HOTKEYS} badgeText={'badge'} />
            <Box paddingX={2} paddingTop={2}>
              <Text muted size={1}>
                Don't use everything at once
              </Text>
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
              icon={CircleIcon}
              text={text}
              hotkeys={HOTKEYS}
              badgeText={'badge'}
              iconRight={CheckmarkIcon}
            />
          </Menu>
        </Card>
      </Stack>
    </Container>
  )
}
