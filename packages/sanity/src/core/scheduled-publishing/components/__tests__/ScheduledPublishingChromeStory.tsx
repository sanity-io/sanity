import {Card, Text} from '@sanity/ui'
import {Container, Box, VStack} from 'ui5'

import EmptySchedules from '../../tool/schedules/EmptySchedules'
import ErrorCallout from '../errorCallout/ErrorCallout'
import InfoCallout from '../infoCallout/InfoCallout'
import ToastDescription from '../toastDescription/ToastDescription'

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
 * so InfoCallout wraps where it wraps in the studio. The toast descriptions
 * sit in a toast-sized card with the copy `useScheduleOperation` pushes
 * (a fixed date string stands in for the formatted execute date). Copy and
 * icons are fixtures (no live schedules).
 */
export function ScheduledPublishingChromeStory() {
  return (
    <Card padding={4}>
      <VStack gap={5}>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            error callout
          </Text>
          <Container size={1}>
            <Box paddingTop={4} paddingX={4}>
              <VStack gap={3}>
                <ErrorCallout title="Could not load schedules" />
                <ErrorCallout
                  description="The document was deleted before the scheduled time."
                  title="Schedule failed"
                />
              </VStack>
            </Box>
          </Container>
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            info callout
          </Text>
          <Container size={1}>
            <Box paddingTop={4} paddingX={4}>
              <InfoCallout />
            </Box>
          </Container>
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            empty schedules
          </Text>
          <Container size={1} padding={4}>
            <VStack gap={3}>
              <EmptySchedules scheduleState="scheduled" />
              <EmptySchedules scheduleState="succeeded" />
              <EmptySchedules scheduleState="cancelled" />
              <EmptySchedules scheduleState="scheduled" selectedDate={SELECTED_DATE} />
            </VStack>
          </Container>
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            toast description
          </Text>
          <VStack gap={3} style={{maxWidth: 420}}>
            <Card border padding={3} radius={3} shadow={1} tone="positive">
              <ToastDescription
                body="Publishing on Mon, 15 Jan 2024, 10:00 AM (GMT)"
                title="Schedule created"
              />
            </Card>
            <Card border padding={3} radius={3} shadow={1} tone="positive">
              <ToastDescription title="Schedule deleted" />
            </Card>
            <Card border padding={3} radius={3} shadow={1} tone="critical">
              <ToastDescription
                body="Request failed with status 403"
                title="Unable to create schedule"
              />
            </Card>
          </VStack>
        </VStack>
      </VStack>
    </Card>
  )
}
