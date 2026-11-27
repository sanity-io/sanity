import {type Meta, type StoryObj} from '@storybook/react-vite'

import {DialogFooterStory} from './DialogFooterStory'

/**
 * Chromatic sentinel: scheduled-publishing dialog footer Flex row and
 * Button tones after the ui5 migration. Hardcoded English; no dates.
 */
const meta = {
  title: 'Scheduled Publishing/Dialog Footer',
  component: DialogFooterStory,
} satisfies Meta<typeof DialogFooterStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
