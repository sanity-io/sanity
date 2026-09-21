import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ValueWarningsStory} from './ValueWarningsStory'

const meta = {
  title: 'Inputs/Value Warnings',
  component: ValueWarningsStory,
} satisfies Meta<typeof ValueWarningsStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
