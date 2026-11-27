import {Card} from '@sanity/ui'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {type TimeZoneScope} from '../../../../hooks/useTimeZone'
import {TimeZoneButton} from '../TimeZoneButton'

// A zone without daylight saving and a fixed relative date keep the offset
// the hook computes identical on every capture (same fixture as the time
// zone dialog story).
const SCOPE: TimeZoneScope = {
  type: 'input',
  id: 'storybook-button',
  defaultTimeZone: 'Asia/Tokyo',
  relativeDate: new Date('2026-01-15T12:00:00.000Z'),
}

const TOOLTIP = 'Fixture timezone hint'

function Label({children}: {children: string}) {
  return (
    <Text muted size={1} weight="medium" as="div" trim={true}>
      {children}
    </Text>
  )
}

/**
 * Chromatic sentinel for the date-input time zone trigger after the ui5 Text
 * / Icon migration: a switchable bleed button and a locked inline icon+label
 * (Sanity UI Inline). Copy comes from the Tokyo fixture, not the renderer
 * local zone. The dialog and tooltip stay closed.
 */
export function TimeZoneButtonStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Label>switchable</Label>
            <TimeZoneButton allowTimeZoneSwitch timeZoneScope={SCOPE} tooltipContent={TOOLTIP} />
          </VStack>
          <VStack gap={2}>
            <Label>locked</Label>
            <TimeZoneButton
              allowTimeZoneSwitch={false}
              timeZoneScope={SCOPE}
              tooltipContent={TOOLTIP}
            />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
