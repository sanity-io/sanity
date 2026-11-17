import {type Meta, type StoryObj} from '@storybook/react-vite'
import noop from 'lodash-es/noop.js'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {ScheduleDraftDialog} from '../ScheduleDraftDialog'

/**
 * The "schedule draft for publishing" dialog: description, the labelled
 * date-time input with its time zone button, and the critical warning card
 * shown when the picked date is already in the past. The calendar stays
 * closed. Both stories pin `initialDate` far from today so the past / future
 * branch never flips with the clock.
 */
const meta = {
  title: 'Single Doc Release/Schedule Draft Dialog',
  component: ScheduleDraftDialog,
  args: {
    onClose: noop,
    onSchedule: noop,
  },
  decorators: [
    (Story) => (
      <TestWrapper schemaTypes={[]}>
        <Story />
      </TestWrapper>
    ),
  ],
} satisfies Meta<typeof ScheduleDraftDialog>

export default meta
type Story = StoryObj<typeof meta>

/** A future publish date: confirm enabled, no warning. */
export const FutureDate: Story = {
  args: {initialDate: '2099-03-14T09:30:00.000Z'},
}

/** A past publish date: the critical warning card and a disabled confirm button. */
export const PastDate: Story = {
  args: {initialDate: '2001-03-14T09:30:00.000Z'},
}
