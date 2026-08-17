import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ElementWithChangeBarStory} from '../../../../packages/sanity/src/core/changeIndicators/__tests__/ElementWithChangeBarStory'

/**
 * Reuses the in-package harness: vanilla-extract change-bar states.
 */
const meta = {
  title: 'Change Indicators/Element With Change Bar',
  component: ElementWithChangeBarStory,
} satisfies Meta<typeof ElementWithChangeBarStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
