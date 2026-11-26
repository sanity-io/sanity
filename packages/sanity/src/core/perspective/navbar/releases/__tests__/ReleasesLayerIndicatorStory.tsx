import {Card} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {Text, VStack} from 'ui5'

import {MenuItem} from '../../../../../ui-components/menuItem/MenuItem'
import {ReleasesMenuItemIndicator, ReleasesMenuLabelIndicator} from '../ReleasesLayerIndicator'

/**
 * Chromatic sentinel for the releases-menu stack line: a 1px `--card-border-color`
 * connector that first / within / last MenuItem rows and the type-label Box
 * share. Painted from props (no live releases). The line is CSS on the
 * wrapper; TypeScript cannot see a token or offset drift.
 */
export function ReleasesLayerIndicatorStory() {
  return (
    <Card padding={4} style={{maxWidth: 320}}>
      <VStack gap={5}>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            stack line (first / within / last)
          </Text>
          <Card padding={1} radius={2} shadow={2}>
            <Menu>
              <ReleasesMenuItemIndicator
                $inRange
                $first
                $last={false}
                $isDefaultPerspective={false}
              >
                <MenuItem text="First in range" />
              </ReleasesMenuItemIndicator>
              <ReleasesMenuItemIndicator
                $inRange
                $first={false}
                $last={false}
                $isDefaultPerspective={false}
              >
                <MenuItem text="Within range" />
              </ReleasesMenuItemIndicator>
              <ReleasesMenuItemIndicator
                $inRange
                $first={false}
                $last
                $isDefaultPerspective={false}
              >
                <MenuItem text="Last in range" />
              </ReleasesMenuItemIndicator>
            </Menu>
          </Card>
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            default perspective (taller join)
          </Text>
          <Card padding={1} radius={2} shadow={2}>
            <Menu>
              <ReleasesMenuItemIndicator $inRange $first $last={false} $isDefaultPerspective>
                <MenuItem text="Published" />
              </ReleasesMenuItemIndicator>
              <ReleasesMenuItemIndicator
                $inRange
                $first={false}
                $last
                $isDefaultPerspective={false}
              >
                <MenuItem text="Asap release" />
              </ReleasesMenuItemIndicator>
            </Menu>
          </Card>
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            out of range (no line)
          </Text>
          <Card padding={1} radius={2} shadow={2}>
            <Menu>
              <ReleasesMenuItemIndicator
                $inRange={false}
                $first={false}
                $last={false}
                $isDefaultPerspective={false}
              >
                <MenuItem text="Filtered out" />
              </ReleasesMenuItemIndicator>
            </Menu>
          </Card>
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            type label
          </Text>
          <Card padding={1} radius={2} shadow={2}>
            <VStack gap={2}>
              <ReleasesMenuLabelIndicator
                $withinRange
                paddingLeft={2}
                paddingTop={3}
                paddingBottom={1}
              >
                <Text muted size={1} as="div" trim={true}>
                  ASAP (line through label)
                </Text>
              </ReleasesMenuLabelIndicator>
              <ReleasesMenuLabelIndicator
                $withinRange={false}
                paddingLeft={2}
                paddingTop={3}
                paddingBottom={1}
              >
                <Text muted size={1} as="div" trim={true}>
                  Scheduled (no line)
                </Text>
              </ReleasesMenuLabelIndicator>
            </VStack>
          </Card>
        </VStack>
      </VStack>
    </Card>
  )
}
