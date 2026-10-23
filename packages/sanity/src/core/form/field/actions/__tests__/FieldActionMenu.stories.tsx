import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, userEvent, within} from 'storybook/test'

import {FieldActionMenuOpenStory, FieldActionMenuStory} from './FieldActionMenuStory'

/**
 * Chromatic sentinel: field-action overflow trigger plus the expanded group
 * Box title after the ui5 Box migration. Open play captures the portaled
 * menu.
 */
const meta = {
  title: 'Form/Field Action Menu',
  component: FieldActionMenuStory,
} satisfies Meta<typeof FieldActionMenuStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}

export const Open: Story = {
  render: () => <FieldActionMenuOpenStory />,
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    // TestWrapper suspends on the mock workspace; wait for the trigger.
    const trigger = await canvas.findByTestId('field-actions-trigger')
    await userEvent.click(trigger)
    const body = within(document.body)
    const copy = await body.findByRole('menuitem', {name: 'Copy field'})
    await expect(copy).toBeVisible()
  },
}
