import {type Meta, type StoryObj} from '@storybook/react-vite'

import {DetailLayoutStory} from './DetailLayoutStory'

/**
 * Reuses the in-package harness: releases/variants detail identity and
 * properties after the ui5 Box migration. Fixture copy only.
 */
const meta = {
  title: 'Studio/Detail Layout',
  component: DetailLayoutStory,
  parameters: {chromatic: {delay: 500}},
} satisfies Meta<typeof DetailLayoutStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
