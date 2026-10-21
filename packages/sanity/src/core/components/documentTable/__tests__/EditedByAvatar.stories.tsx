import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, within} from 'storybook/test'

import {EditedByAvatarStory} from './EditedByAvatarStory'

/**
 * Chromatic sentinel: document-table "Edited by" cell after the ui5 Flex
 * migration. Wide versus container-query-collapsed name.
 */
const meta = {
  title: 'Studio/Edited By Avatar',
  component: EditedByAvatarStory,
} satisfies Meta<typeof EditedByAvatarStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    // useUser resolves the primed current user after commit; wait so
    // Chromatic does not archive the animated AvatarSkeleton. Both cells
    // share the display name as the avatar accessible name.
    const avatars = await canvas.findAllByRole('img', {name: 'Doug'})
    await expect(avatars).toHaveLength(2)
  },
}
