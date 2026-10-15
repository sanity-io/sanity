import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, within} from 'storybook/test'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {type TimeZoneScope} from '../../../hooks/useTimeZone'
import DialogTimeZone from '../DialogTimeZone'

// A zone without daylight saving and a fixed relative date keep the offset the
// hook computes ("GMT+9") identical on every capture. The default is not the
// renderer's local zone, so the "Select local time zone" link is visible.
const SCOPE: TimeZoneScope = {
  type: 'input',
  id: 'storybook',
  defaultTimeZone: 'Asia/Tokyo',
  relativeDate: new Date('2026-01-15T12:00:00.000Z'),
}

/**
 * The "Select time zone" dialog opened from a date-time input's time zone
 * button. Chromatic sentinel for the dialog body: the scope description, the
 * label row with its "Select local time zone" link, and the autocomplete,
 * stacked with ui5 spacing. Rendered inside `TestWrapper` because `useTimeZone`
 * reads the workspace key-value store and the footer labels resolve through
 * the studio i18n instance.
 */
const meta = {
  title: 'Studio/Time Zone Dialog',
  component: DialogTimeZone,
  decorators: [
    (Story) => (
      <TestWrapper schemaTypes={[]}>
        <Story />
      </TestWrapper>
    ),
  ],
} satisfies Meta<typeof DialogTimeZone>

export default meta
type Story = StoryObj<typeof meta>

/** Input scope with a preset zone; the update button stays disabled until the selection changes. */
export const Default: Story = {
  args: {
    timeZoneScope: SCOPE,
    onClose: () => null,
  },
  play: async () => {
    const body = within(document.body)
    await expect(
      body.findByDisplayValue('Japan Standard Time (Asia/Tokyo)', undefined, {timeout: 3000}),
    ).resolves.toBeInTheDocument()
  },
}
