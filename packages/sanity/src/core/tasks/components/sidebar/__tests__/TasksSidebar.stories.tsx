import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {TasksSidebarStory} from './TasksSidebarStory'

/**
 * Tasks sidebar unavailable state, shown when the plan check failed: the header without tabs and
 * with the New button disabled, and the muted message in the content area. The sidebar reads the
 * mode with `use()`, so `play` waits for the settled state before the snapshot is taken, and the
 * delay lets the card's fade-in finish.
 */
const meta = {
  title: 'Tasks/Sidebar',
  component: TasksSidebarStory,
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof TasksSidebarStory>

export default meta
type Story = StoryObj<typeof meta>

export const Unavailable: Story = {
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    // The sidebar card mounts at opacity 0 once the mode has settled and fades in, so the
    // message exists before it counts as visible
    await waitFor(
      () =>
        expect(canvas.getByText('Tasks are unavailable right now. Try again later.')).toBeVisible(),
      {timeout: 3000},
    )
    await expect(canvas.getByRole('button', {name: 'New task'})).toBeDisabled()
  },
}
