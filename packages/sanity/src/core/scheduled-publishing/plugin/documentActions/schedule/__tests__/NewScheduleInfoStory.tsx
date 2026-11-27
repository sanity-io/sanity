import {Card} from '@sanity/ui'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {NewScheduleInfo} from '../NewScheduleInfo'

/**
 * Chromatic sentinel for the schedule-action info copy after the ui5
 * VStack migration. The no-errors path is the publish-later explanation
 * only — the critical ValidationWarning card needs live markers and is
 * omitted. Fixture document id; no live schedule.
 */
export function NewScheduleInfoStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <NewScheduleInfo id="author-fixture" schemaType="author" />
      </Card>
    </TestWrapper>
  )
}
