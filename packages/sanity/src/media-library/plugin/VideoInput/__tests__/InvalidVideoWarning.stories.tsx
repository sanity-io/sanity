import {type Meta, type StoryObj} from '@storybook/react-vite'

import {InvalidVideoWarningStory} from './InvalidVideoWarningStory'

/**
 * Reuses the in-package harness: invalid-video caution card after the ui5
 * Box migration. Media-library i18n only; no video assets.
 */
const meta = {
  title: 'Media Library/Invalid Video Warning',
  component: InvalidVideoWarningStory,
  parameters: {chromatic: {delay: 500}},
} satisfies Meta<typeof InvalidVideoWarningStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
