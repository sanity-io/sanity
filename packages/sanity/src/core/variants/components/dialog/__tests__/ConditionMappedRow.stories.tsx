import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor} from 'storybook/test'

import {ConditionMappedRowStory} from './ConditionMappedRowStory'

/**
 * Reuses the in-package harness: mapped-condition row Flex after the
 * ui5 Box migration. TestWrapper suspends on the variants locale
 * bundle, so play waits for the first trigger.
 */
const meta = {
  title: 'Variants/Condition Mapped Row',
  component: ConditionMappedRowStory,
} satisfies Meta<typeof ConditionMappedRowStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  play: async () => {
    await waitFor(
      () =>
        expect(
          document.querySelector('[data-testid="variant-form-condition-key-menu-button"]'),
        ).toBeTruthy(),
      {timeout: 5_000},
    )
  },
}
