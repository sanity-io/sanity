import {hues} from '@sanity/color'
import {CheckmarkIcon, CircleIcon} from '@sanity/icons'
import {Avatar, Box, Card, Container, Menu, Stack, Text} from '@sanity/ui'
import {useString} from '@sanity/ui-workshop'

import {MenuItem} from '../menuItem/MenuItem'

const HOTKEYS = ['Ctrl', 'Alt', 'P']
const AVATAR_INITIALS = 'AW'

export default function MenuItemStory() {
  const text = useString('Text', 'Text', 'Props') || ''

  return (
    <Container width={0} padding={4}>
      <Stack space={4}>
        <Card>
          <Text size={1}>
            <code>MenuItem</code> components enforce a single line of content with pre-determined
            font size and padding, and also prevents custom children.
          </Text>
        </Card>

        <Card border radius={2}>
          <Box marginBottom={3} padding={3}>
            <Text size={2} weight="medium">
              Recommended usage
            </Text>
          </Box>
          <Menu>
            <MenuItem text={`${text} (with tooltip)`} tooltipProps={{content: 'Example tooltip'}} />
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
                Subtitle and spacing is not recommended
              </Text>
            </Box>
            <MenuItem
              icon={CircleIcon}
              text={text}
              iconRight={CheckmarkIcon}
              __unstable_subtitle="With a subtitle"
              __unstable_space={1}
            />
            <Box paddingX={2} paddingTop={2}>
              <Text muted size={1}>
                Don't use everything at once
              </Text>
            </Box>
            <MenuItem
              preview={<Avatar initials={AVATAR_INITIALS} size={1} />}
              icon={CircleIcon}
              text={text}
              hotkeys={HOTKEYS}
              badgeText={'badge'}
              iconRight={CheckmarkIcon}
              __unstable_subtitle="With a subtitle"
            />
          </Menu>
        </Card>
      </Stack>
    </Container>
  )
}
