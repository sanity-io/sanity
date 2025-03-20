import {EditIcon, EllipsisHorizontalIcon, PublishIcon, TrashIcon} from '@sanity/icons'
import {Box, Card, Container, Menu, Stack, Text} from '@sanity/ui'

import {MenuGroup} from '../menuGroup/MenuGroup'
import {MenuItem} from '../menuItem/MenuItem'

export default function MenuGroupStory() {
  return (
    <Container width={0} padding={4}>
      <Stack space={4}>
        <Card>
          <Text size={1}>
            The <code>MenuGroup</code> component enforces font size and padding of the group{' '}
            <code>MenuItem</code>. Group popovers are not animated.
          </Text>
        </Card>

        <Card border radius={2}>
          <Box marginBottom={3} padding={3}>
            <Text size={2} weight="medium">
              Usage examples
            </Text>
          </Box>
          <Stack padding={3} space={4}>
            <Stack space={3}>
              <Text muted size={1}>
                Default
              </Text>
              <Menu>
                <MenuItem icon={PublishIcon} text="Menu Item 1" />
                <MenuItem icon={EditIcon} text="Menu Item 2" />
                <MenuItem icon={TrashIcon} text="Menu Item 3" />
                <MenuGroup
                  icon={EllipsisHorizontalIcon}
                  popover={{placement: 'right-start'}}
                  text="Group"
                >
                  <MenuItem text="Nested Menu Item 1" />
                  <MenuItem text="Nested Menu Item 2" />
                  <MenuItem text="Nested Menu Item 3" />
                </MenuGroup>
              </Menu>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}
