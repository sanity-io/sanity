import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, userEvent, waitFor, within} from 'storybook/test'

import {FormChromeStory} from './FormChromeStory'

/**
 * Chromatic sentinel for misc form chrome: fields, fieldsets, incompatible
 * array items, member errors, and an input error boundary. Fixture copy only;
 * the play step opens the migrated popover and member-error details.
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

    await userEvent.click(
      body.getByRole('button', {name: /Item of type .* not valid for this list/}),
    )
    await waitFor(
      () =>
        expect(body.getByText(/The current schema does not declare items of type/)).toBeVisible(),
      {timeout: 5000},
    )

    for (const detailsButton of body.getAllByRole('button', {name: 'Developer info'})) {
      if (detailsButton.nextElementSibling?.hasAttribute('hidden')) {
        await userEvent.click(detailsButton)
      }
    }

    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  },
}
