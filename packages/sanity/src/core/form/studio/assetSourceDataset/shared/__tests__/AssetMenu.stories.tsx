import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, userEvent, within} from 'storybook/test'

import {AssetMenuOpenStory, AssetMenuStory} from './AssetMenuStory'

/**
 * Chromatic sentinel for the dataset asset-source row menu: ghost / selected
 * / bleed triggers, plus the open menu with the critical Delete item.
 */
const meta = {
  title: 'Form/Asset Menu',
  component: AssetMenuStory,
} satisfies Meta<typeof AssetMenuStory>

export default meta
type Story = StoryObj<typeof meta>

export const Closed: Story = {}

export const Open: Story = {
  render: () => <AssetMenuOpenStory />,
  parameters: {chromatic: {delay: 300}},
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    // TestWrapper suspends on the locale bundle; wait for the trigger.
    const trigger = await canvas.findByRole('button', {}, {timeout: 5000})
    await userEvent.click(trigger)
    const body = within(document.body)
    const deleteItem = await body.findByRole('menuitem', {name: 'Delete'}, {timeout: 5000})
    await expect(deleteItem).toBeVisible()
    await expect(body.getByRole('menuitem', {name: 'Show usage'})).toBeVisible()
  },
}
