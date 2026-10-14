import {type Meta, type StoryObj} from '@storybook/react-vite'

import {NotAuthenticatedScreenStory} from './NotAuthenticatedScreenStory'

/**
 * Chromatic sentinel for the "Not authorized" dialog: heading, the two
 * explanatory paragraphs with the bold "signed in as" account and provider
 * suffix, and the "Sign out" footer button. The user and provider are
 * fixtures (no auth request).
 */
const meta = {
  title: 'Studio/Not Authenticated Screen',
  component: NotAuthenticatedScreenStory,
} satisfies Meta<typeof NotAuthenticatedScreenStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
