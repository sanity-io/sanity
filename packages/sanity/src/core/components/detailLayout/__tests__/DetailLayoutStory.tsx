import {CalendarIcon} from '@sanity/icons/Calendar'
import {EarthGlobeIcon} from '@sanity/icons/EarthGlobe'
import {Card, Flex, Stack, Text} from '@sanity/ui'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {DetailIdentity} from '../DetailIdentity'
import {DetailPropertiesPanel} from '../DetailPropertiesPanel'

// Six+ lines / ~450 chars so Chromatic captures the four-line clamp and
// overflow:hidden, not a description that merely sits on the clamp boundary.
const CLAMPED_DESCRIPTION =
  'This description is long enough to overflow the four-line clamp on DetailIdentity. ' +
  'The extra sentences exist so Chromatic captures overflow:hidden, not a description that merely ' +
  'sits on the clamp boundary. Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' +
  'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, ' +
  'quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ' +
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.'

/**
 * Chromatic sentinel for the post-migration ui5 detail layout: identity
 * (placeholder opacity, four-line overflow clamp) and properties panel
 * (glyph column alignment, title-leading offset). Copy is a fixture (no
 * live releases).
 */
export function DetailLayoutStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 720}}>
        <Stack gap={5}>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              titled with description
            </Text>
            <Flex align="flex-start" gap={4} justify="space-between">
              <DetailIdentity
                description={CLAMPED_DESCRIPTION}
                title="Summer editorial"
                titleAs="h1"
                titlePlaceholder="Untitled release"
              />
              <DetailPropertiesPanel
                sections={[
                  {
                    title: 'Schedule',
                    rows: [
                      {icon: <CalendarIcon />, label: 'When', value: 'As soon as possible'},
                      {icon: <EarthGlobeIcon />, label: 'Timezone', value: 'Europe/Oslo'},
                    ],
                  },
                  {
                    title: 'Created by',
                    rows: [{label: 'Author', value: 'Ada Lovelace'}],
                  },
                ]}
              />
            </Flex>
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              placeholder title
            </Text>
            <DetailIdentity title={undefined} titlePlaceholder="Untitled release" />
          </Stack>
        </Stack>
      </Card>
    </TestWrapper>
  )
}
