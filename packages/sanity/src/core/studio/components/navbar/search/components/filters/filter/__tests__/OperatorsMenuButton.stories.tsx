import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, userEvent, waitFor, within} from 'storybook/test'

import {OperatorsMenuButtonStory} from './OperatorsMenuButtonStory'

/**
 * Chromatic sentinel: search filter operators menu (boolean is / empty)
 * after the ui5 migration. Play opens the ghost trigger so Chromatic
 * captures the portaled list. SearchProvider + fixture schema; no live
 * search.
 */
const meta = {
  title: 'Studio/Search Operators Menu',
  component: OperatorsMenuButtonStory,
} satisfies Meta<typeof OperatorsMenuButtonStory>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  play: async () => {
    const body = within(document.body)
    await waitFor(() => expect(body.getByRole('button', {name: 'is'})).toBeVisible(), {
      timeout: 5000,
    })
    await userEvent.click(body.getByRole('button', {name: 'is'}))
    await waitFor(() => expect(body.getByRole('menuitem', {name: 'empty'})).toBeVisible(), {
      timeout: 3000,
    })
  },
}
