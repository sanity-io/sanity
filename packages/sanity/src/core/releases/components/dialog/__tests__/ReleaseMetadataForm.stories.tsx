import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {ReleaseMetadataFormStory} from './ReleaseMetadataFormStory'

/**
 * Chromatic sentinel: configured release metadata fields (string list and
 * string) in the create/edit dialog form, with and without readOnly. The
 * stack gap and omitted row gutter are the bits TypeScript will not catch
 * on a ui5 / form-chrome swap.
 */
const meta = {
  title: 'Releases/Release Metadata Form',
  component: ReleaseMetadataFormStory,
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof ReleaseMetadataFormStory>

export default meta
type Story = StoryObj<typeof meta>

async function waitForMetadataFields(canvasElement: HTMLElement) {
  const canvas = within(canvasElement)
  await waitFor(() => expect(canvas.getByTestId('field-legalReview')).toBeVisible(), {
    timeout: 10_000,
  })
  await waitFor(() => expect(canvas.getByTestId('field-owner')).toBeVisible(), {timeout: 5000})
}

export const Default: Story = {
  args: {readOnly: false},
  play: async ({canvasElement}) => {
    await waitForMetadataFields(canvasElement)
  },
}

export const ReadOnly: Story = {
  args: {readOnly: true},
  play: async ({canvasElement}) => {
    await waitForMetadataFields(canvasElement)
  },
}
