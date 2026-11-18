import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, within} from 'storybook/test'

import {MissingPreviewAccessCardStory} from './MissingPreviewAccessCardStory'

/**
 * Chromatic sentinel: Presentation missing-preview-access card after the
 * ui5 ErrorCard migration. Named-role and generic copy. Fixture roles only.
 */
const meta = {
  title: 'Presentation/Missing Preview Access Card',
  component: MissingPreviewAccessCardStory,
} satisfies Meta<typeof MissingPreviewAccessCardStory>

export default meta
type Story = StoryObj<typeof meta>

/** Locale provider suspends; wait for both continue-without-drafts actions. */
export const States: Story = {
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    const buttons = await canvas.findAllByRole('button', {name: 'Continue without drafts'})
    await expect(buttons).toHaveLength(2)
  },
}
