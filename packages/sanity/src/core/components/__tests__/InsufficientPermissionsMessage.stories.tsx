import {type Meta, type StoryObj} from '@storybook/react-vite'

import {InsufficientPermissionsMessageStory} from './InsufficientPermissionsMessageStory'

/**
 * Reuses the in-package harness: Box padding and role-list copy on the
 * permissions-denied message after the ui5 Box migration.
 */
const meta = {
  title: 'Studio/Insufficient Permissions Message',
  component: InsufficientPermissionsMessageStory,
} satisfies Meta<typeof InsufficientPermissionsMessageStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
