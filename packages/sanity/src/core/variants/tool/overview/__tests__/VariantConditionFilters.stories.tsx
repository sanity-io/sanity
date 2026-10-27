import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, userEvent, waitFor, within} from 'storybook/test'

import {
  VariantConditionFiltersBarStory,
  VariantConditionFiltersMenuStory,
} from './VariantConditionFiltersStory'

/**
 * Chromatic sentinel: variants overview filter bar after the ui5 Text and
 * Icon migration. Empty compact bar, primary chips, and the open add-filter
 * popover (first dimension selected with a checked value). Fixture facets
 * only; no live variant list.
 */
const meta = {
  title: 'Variants/Condition Filters',
  component: VariantConditionFiltersBarStory,
} satisfies Meta<typeof VariantConditionFiltersBarStory>

export default meta
type Story = StoryObj<typeof meta>

export const Bar: Story = {}

/** Open add-filter popover with chips behind it and the first dimension selected. */
export const AddMenu: Story = {
  render: () => <VariantConditionFiltersMenuStory />,
  play: async () => {
    const body = within(document.body)
    await waitFor(() => expect(body.getByRole('button', {name: 'Add filter'})).toBeVisible(), {
      timeout: 5000,
    })
    await userEvent.click(body.getByRole('button', {name: 'Add filter'}))
    await waitFor(
      () => expect(body.getByTestId('variant-filter-dimension-audience')).toBeVisible(),
      {timeout: 3000},
    )
    await expect(body.getByTestId('variant-filter-value-audience-alpha')).toBeVisible()
  },
}
