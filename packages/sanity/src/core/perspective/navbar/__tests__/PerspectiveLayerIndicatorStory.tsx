import {Card, Stack, Text} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'

import {MenuItem} from '../../../../ui-components/menuItem/MenuItem'
import {
  GlobalPerspectiveMenuItemIndicator,
  GlobalPerspectiveMenuLabelIndicator,
} from '../PerspectiveLayerIndicator'

/**
 * Chromatic sentinel for perspective-menu Box padding (label inset) and the
 * in-range layer line on menu items. Items stay closed. Shared with Storybook
 * via a thin CSF wrapper.
 */
export function PerspectiveLayerIndicatorStory() {
  return (
    <Card padding={4} style={{maxWidth: 320}}>
      <Stack gap={5}>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            label outside range
          </Text>
          <GlobalPerspectiveMenuLabelIndicator paddingY={3} $withinRange={false}>
            <Text size={1} weight="medium">
              Releases
            </Text>
          </GlobalPerspectiveMenuLabelIndicator>
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            label within range
          </Text>
          <GlobalPerspectiveMenuLabelIndicator paddingY={3} $withinRange>
            <Text size={1} weight="medium">
              Releases
            </Text>
          </GlobalPerspectiveMenuLabelIndicator>
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            item first / within / last
          </Text>
          <Card padding={1} radius={2} shadow={2}>
            <Menu>
              <GlobalPerspectiveMenuItemIndicator
                $first
                $inRange
                $isDefaultPerspective={false}
                $last={false}
              >
                <MenuItem text="Published" />
              </GlobalPerspectiveMenuItemIndicator>
              <GlobalPerspectiveMenuItemIndicator
                $first={false}
                $inRange
                $isDefaultPerspective={false}
                $last={false}
              >
                <MenuItem text="Drafts" />
              </GlobalPerspectiveMenuItemIndicator>
              <GlobalPerspectiveMenuItemIndicator
                $first={false}
                $inRange
                $isDefaultPerspective={false}
                $last
              >
                <MenuItem text="Summer launch" />
              </GlobalPerspectiveMenuItemIndicator>
            </Menu>
          </Card>
        </Stack>
      </Stack>
    </Card>
  )
}
