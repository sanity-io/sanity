import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {FieldDiffChromeStory} from './FieldDiffChromeStory'

/**
 * Reuses the in-package harness: review-changes chrome (ValueError,
 * ChangesError, MetaInfo, ChangeBreadcrumb, the DiffErrorBoundary fallback)
 * after the ui5 Box migration, plus the styled-components field change
 * pieces (revert button, diff border, portable text decorators, string diff
 * segments, the no-image placeholder).
 */
const meta = {
  title: 'Field/Diff Chrome',
  component: FieldDiffChromeStory,
} satisfies Meta<typeof FieldDiffChromeStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  // TestWrapper suspends on the mock workspace; wait for the fixtures to paint.
  play: async () => {
    const body = within(document.body)
    await waitFor(() => expect(body.getByText('Field about to be reverted')).toBeVisible(), {
      timeout: 5000,
    })
    await expect(body.getByText('from a release')).toBeVisible()
    await expect(body.getAllByText('Revert change')).toHaveLength(3)
  },
}
