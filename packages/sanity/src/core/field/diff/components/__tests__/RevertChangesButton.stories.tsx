import {type Meta, type StoryObj} from '@storybook/react-vite'
import {userEvent, within} from 'storybook/test'

import {RevertChangesButtonHoverStory, RevertChangesButtonStory} from './RevertChangesButtonStory'

/**
 * Chromatic sentinel: review-changes revert control. The label Box is
 * hidden until hover/focus; States stays hover-free (icon only).
 */
const meta = {
  title: 'Field/Revert Changes Button',
  component: RevertChangesButtonStory,
} satisfies Meta<typeof RevertChangesButtonStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}

/**
 * Parks the pointer on the revert control so the critical hover ink and
 * the “Revert change” label are in the snapshot.
 */
export const Hover: StoryObj<typeof RevertChangesButtonHoverStory> = {
  render: () => <RevertChangesButtonHoverStory />,
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    // The label Box is `display: none` until hover, so the accessible name is
    // empty — this story mounts a single button.
    const button = await canvas.findByRole('button')
    await userEvent.hover(button)
  },
}
