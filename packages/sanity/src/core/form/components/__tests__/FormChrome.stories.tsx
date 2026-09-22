import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {FormChromeStory} from './FormChromeStory'

/**
 * Chromatic sentinel for misc form chrome: fields, fieldsets, incompatible
 * array items, member errors, and an input error boundary. Fixture copy only;
 * the interactive popover and details disclosures stay closed.
 */
const meta = {
  title: 'Form/Misc Chrome',
  component: FormChromeStory,
} satisfies Meta<typeof FormChromeStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  play: async () => {
    const body = within(document.body)
    await waitFor(
      () => expect(body.getByText('The fixture input could not render')).toBeVisible(),
      {
        timeout: 5000,
      },
    )
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  },
}
