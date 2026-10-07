import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, userEvent, waitFor, within} from 'storybook/test'

import {ConditionMismatchIndicatorStory} from './ConditionMismatchIndicatorStory'

/**
 * Reuses the in-package harness: variants condition-mismatch ToneIcons.
 * Play hovers the unknown-key icon so the portaled tooltip is in the snapshot.
 */
const meta = {
  title: 'Variants/Condition Mismatch Indicator',
  component: ConditionMismatchIndicatorStory,
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof ConditionMismatchIndicatorStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    // TestWrapper suspends on the variants locale bundle.
    await waitFor(() => expect(canvas.getByTestId('mismatch-unknown-key')).toBeVisible(), {
      timeout: 5000,
    })
    await userEvent.hover(canvas.getByTestId('mismatch-unknown-key'))
    const body = within(document.body)
    await waitFor(
      () =>
        expect(
          body.getByText(
            'The condition "market" is not in the configured list. Edit the variant to fix it.',
          ),
        ).toBeVisible(),
      {timeout: 3000},
    )
  },
}
