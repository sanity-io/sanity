import {type Meta, type StoryObj} from '@storybook/react-vite'
import {within} from 'storybook/test'

import {RemoveTaskDialogStory} from './RemoveTaskDialogStory'

/**
 * Task delete confirmation. The dialog portals, so `play` waits for the
 * role and blurs autofocus before Chromatic captures. Copy is locale-fixture
 * only — no timestamps.
 */
const meta = {
  title: 'Tasks/Remove Task Dialog',
  component: RemoveTaskDialogStory,
} satisfies Meta<typeof RemoveTaskDialogStory>

export default meta
type Story = StoryObj<typeof meta>

async function waitForOpenDialog() {
  const body = within(document.body)
  await body.findByRole('dialog', {}, {timeout: 5_000})
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
}

export const Open: Story = {
  play: waitForOpenDialog,
}

export const Confirming: Story = {
  args: {removeStatus: 'loading'},
  play: waitForOpenDialog,
}
