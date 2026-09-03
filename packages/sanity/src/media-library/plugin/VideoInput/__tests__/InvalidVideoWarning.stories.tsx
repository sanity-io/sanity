import {type Meta, type StoryObj} from '@storybook/react-vite'

import {InvalidVideoWarningStory} from './InvalidVideoWarningStory'

/**
 * Chromatic sentinel: post-migration ui5 invalid-video caution card.
 * Media-library i18n only; no video assets.
 */
const meta = {
  title: 'Media Library/Invalid Video Warning',
  component: InvalidVideoWarningStory,
  tags: ['!dev', '!autodocs', 'vrt-only'],
} satisfies Meta<typeof InvalidVideoWarningStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
