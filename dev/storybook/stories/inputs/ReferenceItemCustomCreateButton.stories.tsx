import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ReferenceItemCustomCreateButtonStory} from '../../../../packages/sanity/src/core/form/inputs/ReferenceInput/__tests__/ReferenceItemCustomCreateButtonStory'

/**
 * Reuses the `ReferenceItemCustomCreateButton.browser.test.tsx` harness: a
 * reference array input with a customized create button.
 */
const meta = {
  title: 'Inputs/Reference Item Custom Create Button',
  component: ReferenceItemCustomCreateButtonStory,
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof ReferenceItemCustomCreateButtonStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
