import {type Meta, type StoryObj} from '@storybook/react-vite'

import {
  ButtonStory,
  ButtonVariantsStory,
} from '../../../../packages/sanity/src/ui-components/button/__tests__/ButtonStory'

/**
 * Reuses the in-package harness for the studio Button wrapper.
 */
const meta = {
  title: 'UI Components/Button',
  component: ButtonStory,
} satisfies Meta<typeof ButtonStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    text: 'Publish changes',
    tone: 'primary',
  },
}

/**
 * Every tone and mode combination, plus disabled and loading states, in one
 * snapshot. This is the tone-cascade sentinel for the ui5 migration.
 */
export const AllVariants: Story = {
  args: {
    text: 'Button',
    tone: 'primary',
  },
  render: () => <ButtonVariantsStory />,
}
