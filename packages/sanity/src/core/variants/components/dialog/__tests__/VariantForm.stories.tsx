import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {FailedVariantConditionsStory, InvalidVariantConditionsStory} from './VariantFormStory'

/**
 * Mapped-conditions errors on the variant create/edit form. Invalid static
 * config has no Retry; a resolver failure does. Both wait past the first-paint
 * loading state before Chromatic captures.
 */
const meta = {
  title: 'Variants/Form Conditions Error',
  component: InvalidVariantConditionsStory,
} satisfies Meta<typeof InvalidVariantConditionsStory>

export default meta
type Story = StoryObj<typeof meta>

async function waitForConditionsError() {
  const body = within(document.body)
  await waitFor(() => expect(body.getByTestId('variant-form-conditions-error')).toBeVisible(), {
    timeout: 5000,
  })
  return body
}

/** Empty static `beta.variants.types.variant.conditions`: configuration copy, no Retry. */
export const InvalidConfig: Story = {
  play: async () => {
    const body = await waitForConditionsError()
    await expect(body.getByText('No valid conditions are configured')).toBeVisible()
    await expect(body.queryByRole('button', {name: 'Retry'})).not.toBeInTheDocument()
  },
}

/** Resolver failure: load-error copy and Retry. */
export const LoadFailure: Story = {
  render: () => <FailedVariantConditionsStory />,
  play: async () => {
    const body = await waitForConditionsError()
    await expect(body.getByText('Unable to load conditions')).toBeVisible()
    await expect(body.getByRole('button', {name: 'Retry'})).toBeVisible()
  },
}
