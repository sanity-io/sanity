import {type Meta, type StoryObj} from '@storybook/react-vite'

import {DocumentBannerStory} from './DocumentBannerStory'

/**
 * Reuses the in-package harness: Box padding and card tones on the shared
 * document-pane Banner after the ui5 Box migration.
 */
const meta = {
  title: 'Structure/Document Banner',
  component: DocumentBannerStory,
} satisfies Meta<typeof DocumentBannerStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
