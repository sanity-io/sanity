import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {ReferenceChromeStory} from './ReferenceChromeStory'

/**
 * Chromatic sentinel: reference value states (unavailable, invalid type,
 * created in place), cross-dataset and global document reference previews,
 * and the cross-dataset feature-disabled warning after the ui5 Flex
 * migration. Fixture data; no preview store.
 */
const meta = {
  title: 'Inputs/Reference Chrome',
  component: ReferenceChromeStory,
} satisfies Meta<typeof ReferenceChromeStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  play: async () => {
    const canvas = within(document.body)
    await waitFor(async () => {
      await expect(canvas.getAllByText('Search result fixture')).toHaveLength(2)
    })
  },
}
