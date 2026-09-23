import {type Meta, type StoryObj} from '@storybook/react-vite'

import {FormHeaderStory} from './FormHeaderStory'

/**
 * Reuses the in-package harness: document form header title/type stack at
 * each container-query heading size, singleton and untitled variants.
 */
const meta = {
  title: 'Structure/Form Header',
  component: FormHeaderStory,
} satisfies Meta<typeof FormHeaderStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
