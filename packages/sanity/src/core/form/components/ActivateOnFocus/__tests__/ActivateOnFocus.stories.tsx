import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ActivateOnFocusStory} from './ActivateOnFocusStory'

/**
 * Reuses the in-package harness: the Portable Text activate-on-focus overlay
 * after the ui5 Text migration. Inactive field chrome versus the revealed
 * click-to-activate prompt.
 */
const meta = {
  title: 'Form/Activate On Focus',
  component: ActivateOnFocusStory,
} satisfies Meta<typeof ActivateOnFocusStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
