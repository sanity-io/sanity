import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, userEvent, waitFor, within} from 'storybook/test'

import {SortMenuStory} from './SortMenuStory'

/**
 * Chromatic sentinel: global-search sort menu after the ui5 Flex
 * migration. Play opens Best match so Chromatic captures the portaled
 * ordering list. SearchProvider + studio locale; no live search.
 */
const meta = {
  title: 'Studio/Search Sort Menu',
  component: SortMenuStory,
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof SortMenuStory>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  play: async () => {
    const body = within(document.body)
    await waitFor(() => expect(body.getByRole('button', {name: 'Best match'})).toBeVisible(), {
      timeout: 5000,
    })
    await userEvent.click(body.getByRole('button', {name: 'Best match'}))
    await waitFor(
      () => expect(body.getByRole('menuitem', {name: 'Created: Oldest first'})).toBeVisible(),
      {timeout: 3000},
    )
  },
}
