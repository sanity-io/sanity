import {type Meta, type StoryObj} from '@storybook/react-vite'

import {MultipleAnnotationsStory} from './MultipleAnnotationsStory'

/**
 * Reuses the `Annotations.browser.test.tsx` (multiple annotations) harness: a
 * Portable Text input with several annotation types configured.
 */
const meta = {
  title: 'Portable Text/Multiple Annotations',
  component: MultipleAnnotationsStory,
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof MultipleAnnotationsStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
