import {Card, Container, Stack, Text} from '@sanity/ui'
import {Box} from 'ui5'

import EmptySchedules from '../../tool/schedules/EmptySchedules'
import ErrorCallout from '../errorCallout/ErrorCallout'
import InfoCallout from '../infoCallout/InfoCallout'

// A locally constructed date formats through `format(…, 'd MMMM yyyy')`
// without a TZ dependency, so the selected-date heading is deterministic.
const SELECTED_DATE = new Date(2024, 0, 15)

/**
 * Chromatic sentinel for scheduled-publishing chrome after the ui5 Flex
 * migration. Critical ErrorCallout, suggest InfoCallout, and empty-state
 * cards all pair Flex alignment with Card tones — a mix TypeScript will not
 * catch. Each block sits in the wrapper production gives it (Tool.tsx puts
 * callouts in `Container width={1}` + `Box paddingTop={4} paddingX={4}`,
 * Schedules.tsx puts EmptySchedules in `Container width={1} padding={4}`),
 * so InfoCallout wraps where it wraps in the studio. Copy and icons are
 * fixtures (no live schedules).
 */
export function ScheduledPublishingChromeStory() {
  return (
    <Card padding={4}>
      <Stack gap={5}>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            error callout
          </Text>
          <Container width={1}>
            <Box paddingTop={4} paddingX={4}>
              <Stack gap={3}>
                <ErrorCallout title="Could not load schedules" />
                <ErrorCallout
                  description="The document was deleted before the scheduled time."
                  title="Schedule failed"
                />
              </Stack>
            </Box>
          </Container>
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            info callout
          </Text>
          <Container width={1}>
            <Box paddingTop={4} paddingX={4}>
              <InfoCallout />
            </Box>
          </Container>
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            empty schedules
          </Text>
          <Container width={1} padding={4}>
            <Stack gap={3}>
              <EmptySchedules scheduleState="scheduled" />
              <EmptySchedules scheduleState="succeeded" />
              <EmptySchedules scheduleState="cancelled" />
              <EmptySchedules scheduleState="scheduled" selectedDate={SELECTED_DATE} />
            </Stack>
          </Container>
        </Stack>
      </Stack>
    </Card>
  )
}
