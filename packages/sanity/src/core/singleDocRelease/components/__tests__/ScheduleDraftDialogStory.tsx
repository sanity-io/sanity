import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {ScheduleDraftDialog} from '../ScheduleDraftDialog'

// A date in the past keeps the dialog in its "schedule for a future time" warning state on every
// run, and pins the calendar to January 2024 so the real "today" never shows as selected.
const INITIAL_DATE = new Date('2024-01-15T10:00:00.000Z')

const noop = () => undefined

/**
 * Chromatic sentinel for the schedule-draft dialog: header, description,
 * the datetime input with its time zone button, the disabled confirm
 * button and the critical warning card for a date in the past. The initial
 * date is fixed, so nothing depends on the clock.
 */
export function ScheduleDraftDialogStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <ScheduleDraftDialog initialDate={INITIAL_DATE} onClose={noop} onSchedule={noop} />
    </TestWrapper>
  )
}
