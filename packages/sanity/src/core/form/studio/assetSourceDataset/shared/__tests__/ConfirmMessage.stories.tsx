import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ConfirmMessageStory} from './ConfirmMessageStory'

/**
 * Chromatic sentinel: dataset-asset delete confirm copy and empty usage-list
 * header after the ui5 Grid/Flex migration. File fixtures only; no network.
 */
const meta = {
  title: 'Inputs/Asset Delete Chrome',
  component: ConfirmMessageStory,
} satisfies Meta<typeof ConfirmMessageStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
