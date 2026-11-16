import {type Meta, type StoryObj} from '@storybook/react-vite'

import {DiffCardStory} from './DiffCardStory'

/**
 * Reuses the in-package harness: review-changes DiffCard while it still wraps
 * `@sanity/ui` Card (anonymous vs author colour, del / ins). Tooltips stay
 * closed.
 */
const meta = {
  title: 'Field/Diff Card',
  component: DiffCardStory,
} satisfies Meta<typeof DiffCardStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
