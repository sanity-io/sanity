import {type Meta, type StoryObj} from '@storybook/react-vite'

import {StructurePaneErrorsStory} from './StructurePaneErrorsStory'

/**
 * Chromatic sentinel: post-migration ui5 ErrorPane and UnknownPane.
 * Critical and caution tones, plus unknown vs missing pane type copy.
 */
const meta = {
  title: 'Structure/Pane Errors',
  component: StructurePaneErrorsStory,
  tags: ['!dev', '!autodocs', 'vrt-only'],
} satisfies Meta<typeof StructurePaneErrorsStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
