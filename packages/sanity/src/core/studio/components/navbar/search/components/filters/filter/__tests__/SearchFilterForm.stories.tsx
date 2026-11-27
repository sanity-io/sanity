import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {SearchFilterFormStory} from './SearchFilterFormStory'

/**
 * Reuses the in-package harness: search filter popover form after the
 * vanilla-extract container Flex. FocusLock autofocuses the value
 * input; blur it so the snapshot is about layout, not a focus ring.
 */
const meta = {
  title: 'Studio/Search Filter Form',
  component: SearchFilterFormStory,
} satisfies Meta<typeof SearchFilterFormStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  play: async () => {
    const body = within(document.body)
    await waitFor(() => expect(body.getAllByText('Title').length).toBeGreaterThan(0), {
      timeout: 5_000,
    })
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  },
}
