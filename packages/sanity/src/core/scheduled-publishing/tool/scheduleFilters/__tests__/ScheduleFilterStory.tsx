import {Card, Text} from '@sanity/ui'
import {Flex, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {type Schedule, type ScheduleState} from '../../../types'
import ScheduleFilter from '../ScheduleFilter'

function schedule(id: string, state: ScheduleState): Schedule {
  return {
    action: 'publish',
    author: 'user-1',
    createdAt: '2024-01-15T12:00:00.000Z',
    dataset: 'test',
    description: '',
    documents: [{documentId: 'doc-1'}],
    executeAt: '2024-06-01T12:00:00.000Z',
    id,
    name: id,
    projectId: 'test',
    state,
    stateReason: '',
  }
}

const UPCOMING = [schedule('up-1', 'scheduled'), schedule('up-2', 'scheduled')]
const COMPLETED = [schedule('done-1', 'succeeded')]
const FAILED = [
  schedule('fail-1', 'cancelled'),
  schedule('fail-2', 'cancelled'),
  schedule('fail-3', 'cancelled'),
]

/**
 * Chromatic sentinel for the scheduled-publishing tool filter pills after
 * the ui5 Flex migration. Selected / unselected Upcoming, a Completed count,
 * and Failed (critical tone) pin bleed-button tone plus the title/count
 * pairing — a mix TypeScript will not catch. Counts come from fixture
 * schedules (no live dataset, no formatted dates).
 */
export function ScheduleFilterStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 480}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              upcoming empty
            </Text>
            <Flex gap={2}>
              <ScheduleFilter schedules={[]} state="scheduled" />
            </Flex>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              upcoming selected
            </Text>
            <Flex gap={2}>
              <ScheduleFilter schedules={UPCOMING} selected state="scheduled" />
              <ScheduleFilter schedules={COMPLETED} state="succeeded" />
              <ScheduleFilter schedules={FAILED} state="cancelled" />
            </Flex>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              failed selected
            </Text>
            <Flex gap={2}>
              <ScheduleFilter schedules={UPCOMING} state="scheduled" />
              <ScheduleFilter schedules={COMPLETED} state="succeeded" />
              <ScheduleFilter schedules={FAILED} selected state="cancelled" />
            </Flex>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
