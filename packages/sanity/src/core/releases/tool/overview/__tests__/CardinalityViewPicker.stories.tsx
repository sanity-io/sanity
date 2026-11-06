import {type Meta, type StoryObj} from '@storybook/react-vite'

import {CardinalityViewPickerStory} from './CardinalityViewPickerStory'

/**
 * Reuses the in-package harness: releases vs scheduled-drafts view picker
 * after the ui5 Flex migration (label-only and menu-button states).
 */
const meta = {
  title: 'Releases/Cardinality View Picker',
  component: CardinalityViewPickerStory,
} satisfies Meta<typeof CardinalityViewPickerStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
