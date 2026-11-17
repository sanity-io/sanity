import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {FormFieldChromeStory} from './FormFieldChromeStory'

/**
 * Styled-components sentinel for the form field chrome: fieldsets, legends,
 * header text, the base header with presence, the status slot and the
 * row/cell/container grid.
 */
const meta = {
  title: 'Form/Field Chrome',
  component: FormFieldChromeStory,
} satisfies Meta<typeof FormFieldChromeStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  // TestWrapper suspends on the mock workspace; wait for the fixtures to paint.
  play: async () => {
    const body = within(document.body)
    await waitFor(() => expect(body.getByText('Legacy metadata')).toBeVisible(), {timeout: 5000})
    await expect(body.getByText('Stand-alone body cell')).toBeVisible()
  },
}
