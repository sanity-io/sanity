import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, userEvent, waitFor, within} from 'storybook/test'

import {VariantsMenuStory} from './VariantsMenuStory'

/**
 * Reuses the in-package harness: the variants menu opened over two fixture
 * variants, with the default variant selected. Chromatic sentinel for the
 * menu's zero-gap override on the `@sanity/ui` Menu stack and the ui5 `Box`
 * / `Flex` spacing around the filter input, the default item and the
 * "Other variants" section header.
 */
const meta = {
  title: 'Variants/Variants Menu',
  component: VariantsMenuStory,
} satisfies Meta<typeof VariantsMenuStory>

export default meta
type Story = StoryObj<typeof meta>

/** `play` opens the menu so the snapshot shows the filter input and both sections. */
export const Open: Story = {
  parameters: {chromatic: {delay: 300}},
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    // TestWrapper resolves its mock workspace asynchronously, so the trigger
    // is not in the canvas on the first frame.
    const trigger = await canvas.findByTestId('variants-nav-menu-button', undefined, {
      timeout: 5000,
    })
    await userEvent.click(trigger)
    const body = within(document.body)
    await waitFor(() => expect(body.getByTestId('variants-nav-menu')).toBeVisible(), {
      timeout: 3000,
    })
    await waitFor(() => expect(body.getByText('Norwegian market')).toBeVisible(), {timeout: 3000})
  },
}
