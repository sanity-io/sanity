import {type Meta, type StoryObj} from '@storybook/react-vite'

import {DocumentBannerStatesStory} from './DocumentBannerStatesStory'

/**
 * Reuses the in-package harness: paused scheduled-draft and missing-variant
 * document banners after the ui5 Box migration of Banner.
 */
const meta = {
  title: 'Structure/Document Banner States',
  component: DocumentBannerStatesStory,
} satisfies Meta<typeof DocumentBannerStatesStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
