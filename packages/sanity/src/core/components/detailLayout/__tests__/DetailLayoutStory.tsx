import {CalendarIcon} from '@sanity/icons/Calendar'
import {EarthGlobeIcon} from '@sanity/icons/EarthGlobe'
import {EditIcon} from '@sanity/icons/Edit'
import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {Card, Text} from '@sanity/ui'
import {Flex, VStack} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {Button} from '../../../../ui-components/button/Button'
import {DetailActionRail} from '../DetailActionRail'
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
 * (placeholder opacity, four-line overflow clamp), properties panel
 * (glyph column alignment, title-leading offset), and the top-right
 * DetailActionRail (secondary / primary / overflow gap). Copy is a fixture
 * (no live releases).
 */
export function DetailLayoutStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 720}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              titled with description
            </Text>
            <Flex alignItems="flex-start" gap={4} justifyContent="space-between">
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
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              placeholder title
            </Text>
            <DetailIdentity title={undefined} titlePlaceholder="Untitled release" />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              action rail (secondary, primary, menu)
            </Text>
            <Flex justifyContent="flex-end">
              <DetailActionRail
                menu={
                  <Button
                    icon={EllipsisHorizontalIcon}
                    mode="bleed"
                    tooltipProps={{content: 'More actions'}}
                  />
                }
                primary={<Button text="Run release" tone="primary" />}
                secondary={<Button icon={EditIcon} mode="ghost" text="Edit details" />}
              />
            </Flex>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              action rail (primary only)
            </Text>
            <Flex justifyContent="flex-end">
              <DetailActionRail primary={<Button text="Edit definition" />} />
            </Flex>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
