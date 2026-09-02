import {CalendarIcon} from '@sanity/icons/Calendar'
import {EarthGlobeIcon} from '@sanity/icons/EarthGlobe'
import {Card, Flex, Stack, Text} from '@sanity/ui'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {DetailIdentity} from '../DetailIdentity'
import {DetailPropertiesPanel} from '../DetailPropertiesPanel'

const LONG_DESCRIPTION =
  'A summer editorial covering the coastal collection. Targeting the US storefront, the EU storefront, and the preview bundle so merchandisers can review copy before the scheduled publish.'

/**
 * Chromatic sentinel for the shared releases/variants detail header band.
 * Main already migrated title truncation and property-value cells to ui5
 * Box; this snapshot pins placeholder opacity, four-line clamp, glyph
 * column alignment, and the properties card's title-leading offset — a
 * mix TypeScript will not catch. Copy is a fixture (no live releases).
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
                description={LONG_DESCRIPTION}
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
