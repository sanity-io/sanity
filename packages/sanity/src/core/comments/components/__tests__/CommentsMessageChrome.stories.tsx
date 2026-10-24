import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {CommentsMessageChromeStory} from './CommentsMessageChromeStory'

/**
 * The pieces a rendered comment is assembled from: avatars, the message serializer and its
 * blocks, inline highlight states, mention items, reactions, the onboarding and floating
 * popovers and the inspector header. All of them wrap `@sanity/ui` primitives or carry
 * styled-components rules that the `ui5` migration must preserve.
 */
const meta = {
  title: 'Comments/Message Chrome',
  component: CommentsMessageChromeStory,
} satisfies Meta<typeof CommentsMessageChromeStory>

export default meta

type Story = StoryObj<typeof meta>

export const States: Story = {
  play: async () => {
    const body = within(document.body)
    await waitFor(() => expect(body.getAllByText('@Doug')).toHaveLength(3), {timeout: 5000})
    await expect(body.getByTestId('inline-comment-button')).toBeVisible()
  },
}
