import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {PrimitiveInputsStory} from './PrimitiveInputsStory'

/**
 * The primitive form inputs rendered directly with form-builder shaped props. The string,
 * text, url, email, telephone and number inputs wrap `@sanity/ui` text fields; the boolean
 * input renders the field header chrome itself. Guards the migration of these inputs to `ui5`.
 */
const meta = {
  title: 'Inputs/Primitive Inputs',
  component: PrimitiveInputsStory,
} satisfies Meta<typeof PrimitiveInputsStory>

export default meta

type Story = StoryObj<typeof meta>

export const States: Story = {
  play: async () => {
    const body = within(document.body)
    await waitFor(() => expect(body.getByDisplayValue('Studio visual coverage')).toBeVisible(), {
      timeout: 5000,
    })
    await expect(body.getAllByText('Shown on the front page')).toHaveLength(2)
  },
}
