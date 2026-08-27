import {Card, Stack, Text} from '@sanity/ui'

import EmptySchedules from '../../tool/schedules/EmptySchedules'
import ErrorCallout from '../errorCallout/ErrorCallout'
import InfoCallout from '../infoCallout/InfoCallout'

/**
 * Chromatic sentinel for scheduled-publishing chrome after the ui5 Flex
 * migration. Critical ErrorCallout, suggest InfoCallout, and empty-state
 * cards all pair Flex alignment with Card tones — a mix TypeScript will not
 * catch. Copy and icons are fixtures (no selected dates, no live schedules).
 */
export function ScheduledPublishingChromeStory() {
  return (
    <Card padding={4} style={{maxWidth: 520}}>
      <Stack gap={5}>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            error callout
          </Text>
          <ErrorCallout title="Could not load schedules" />
          <ErrorCallout
            description="The document was deleted before the scheduled time."
            title="Schedule failed"
          />
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            info callout
          </Text>
          <InfoCallout />
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            empty schedules
          </Text>
          <EmptySchedules scheduleState="scheduled" />
          <EmptySchedules scheduleState="succeeded" />
          <EmptySchedules scheduleState="cancelled" />
        </Stack>
      </Stack>
    </Card>
  )
}
