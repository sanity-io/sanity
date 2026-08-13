import {type Meta, type StoryObj} from '@storybook/react-vite'

import ArrayInputStory from '../../../../packages/sanity/src/core/form/inputs/arrays/__tests__/ArrayInputStory'

/**
 * Reuses the `ArrayInput.browser.test.tsx` harness: an array-of-objects input
 * rendered inside the mock studio (`TestWrapper` + `TestForm`).
 */
const meta = {
  title: 'Inputs/Array Input',
  component: ArrayInputStory,
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof ArrayInputStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
