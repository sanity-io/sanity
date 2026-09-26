import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, userEvent, waitFor, within} from 'storybook/test'

import {
  VariantConditionFiltersMenuStory,
  VariantConditionFiltersStory,
} from './VariantConditionFiltersStory'

/**
 * Faceted filter bar of the variant definitions overview: the compact bar
 * with no active filters, the lane-filling bar with active chips and "Clear
 * filters", and the add-filter popover opened by `play`.
 */
const meta = {
  title: 'Variants/Condition Filters',
  component: VariantConditionFiltersStory,
} satisfies Meta<typeof VariantConditionFiltersStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}

/**
 * The add-filter popover: searchable dimension list on the left with the
 * first dimension selected, its values on the right with the active one
 * checked.
 */
export const AddFilterMenu: Story = {
  render: () => <VariantConditionFiltersMenuStory />,
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    // TestWrapper suspends while the mock workspace resolves, so wait for the trigger.
    await userEvent.click(await canvas.findByRole('button', {name: 'Add filter'}, {timeout: 5000}))
    const body = within(document.body)
    await waitFor(() =>
      expect(body.getByTestId('variant-filter-value-audience-alpha')).toBeVisible(),
    )
  },
}
