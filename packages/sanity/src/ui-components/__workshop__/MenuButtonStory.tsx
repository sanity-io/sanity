import {Box, Card, Container, Menu, Stack, Text} from '@sanity/ui'

import {Button} from '../button/Button'
import {MenuButton} from '../menuButton/MenuButton'
import {MenuItem} from '../menuItem/MenuItem'

export default function MenuButtonStory() {
  return (
    <Container width={0} padding={4}>
      <Stack space={4}>
        <Card>
          <Text size={1}>
            All menus in the Studio should be consistently animated, and the <code>MenuButton</code>{' '}
            component enforces this.
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
              <Box>
                <MenuButton
                  button={<Button text="Menu with animation" />}
                  id="menu-button-1"
                  menu={
                    <Menu>
                      <MenuItem text="Menu Item 1" />
                      <MenuItem text="Menu Item 2" />
                      <MenuItem text="Menu Item 3" />
                    </Menu>
                  }
                />
              </Box>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}
