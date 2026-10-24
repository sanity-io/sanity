import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {InventoryChromeStory} from './InventoryChromeStory'

/**
 * Styled-components sentinel for the document group inventory shell:
 * `Container`, `Header`, `Body`, `Footer`, the `VariantSet` card with its
 * header and entry rows, the `StatusBadge`, `TextButton` and the shared
 * `DocumentGroupFilter`.
 */
const meta = {
  title: 'Document Group Inventory/Inventory Chrome',
  component: InventoryChromeStory,
} satisfies Meta<typeof InventoryChromeStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  // TestWrapper suspends on the mock workspace; wait for the fixtures to paint.
  play: async () => {
    const body = within(document.body)
    await waitFor(() => expect(body.getByText('All users (Default)')).toBeVisible(), {
      timeout: 5000,
    })
    await expect(body.getAllByText('Viewing')).toHaveLength(2)
    await expect(body.getByDisplayValue('summer')).toHaveAttribute('readonly')
  },
}
